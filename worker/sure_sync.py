"""Sync accounts, balances and transactions from Sure into Sovi (read-only against Sure).

Idempotent: accounts upsert on (user, source, external_id); transactions upsert on
(user, account, sure transaction id); balance history only inserts days not already stored.
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import asyncpg

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from app.auth.crypto import get_master_key  # noqa: E402
from app.sure.client import SureAuthError, SureClient, SureError, SureExportForbidden  # noqa: E402
from app.sure.details import debt_terms, read_account_records  # noqa: E402
from app.sure.mapping import account_row, daily_balances, transaction_row  # noqa: E402
from app.sure.service import get_credentials  # noqa: E402

logger = logging.getLogger(__name__)

_FIRST_SYNC_DAYS = 400   # as much history as Sure has, within reason
_OVERLAP_DAYS = 14       # re-read recent days so edits (categories, transfers) are picked up
_EPS = Decimal("0.005")
_DETAILS_EVERY = timedelta(hours=20)       # each export leaves a file in Sure (the API cannot delete it): keep them rare
_DETAILS_MIN_GAP = timedelta(hours=1)      # even on a manual refresh
_EXPORT_POLL_SECONDS = 2
_EXPORT_POLL_TRIES = 90


async def _upsert_account(db: asyncpg.Connection, user_id: str, row: dict) -> str:
    rec = await db.fetchrow(
        """
        INSERT INTO accounts (id, user_id, name, type, currency, is_manual, source, external_id, institution, subtype)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, false, 'sure', $5, $6, $7)
        ON CONFLICT (user_id, source, external_id) WHERE external_id IS NOT NULL DO UPDATE
          SET name = EXCLUDED.name, currency = EXCLUDED.currency,
              institution = EXCLUDED.institution, subtype = EXCLUDED.subtype, archived = false
        RETURNING id
        """,
        user_id, row["name"], row["type"], row["currency"], row["external_id"], row["institution"], row["subtype"],
    )
    return str(rec["id"])


async def _write_snapshots(db: asyncpg.Connection, user_id: str, account_id: str, points: list[tuple[datetime, Decimal]]) -> int:
    """Insert one snapshot per day, skipping days that already have one for this account."""
    if not points:
        return 0
    have = {r["d"] for r in await db.fetch(
        "SELECT (balance_date AT TIME ZONE 'UTC')::date AS d FROM balance_snapshots WHERE account_id=$1", account_id)}
    new = [(d, b) for d, b in points if d.date() not in have]
    if new:
        await db.executemany(
            """
            INSERT INTO balance_snapshots (account_id, user_id, balance, balance_date, captured_at)
            VALUES ($1, $2, $3, $4, $4)
            """,
            [(account_id, user_id, b, d + timedelta(hours=23, minutes=59)) for d, b in new],
        )
    return len(new)


async def _upsert_transactions(db: asyncpg.Connection, user_id: str, account_id: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    await db.executemany(
        """
        INSERT INTO transactions (id, user_id, account_id, sfin_txn_id, posted, amount, description, pending,
                                  source, merchant, ext_category, is_transfer)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'sure', $8, $9, $10)
        ON CONFLICT (user_id, account_id, sfin_txn_id) DO UPDATE
          SET posted = EXCLUDED.posted, amount = EXCLUDED.amount, description = EXCLUDED.description,
              merchant = EXCLUDED.merchant, ext_category = EXCLUDED.ext_category, is_transfer = EXCLUDED.is_transfer
        """,
        [(user_id, account_id, r["external_id"], r["posted"], r["amount"], r["description"], r["pending"],
          r["merchant"], r["ext_category"], r["is_transfer"]) for r in rows],
    )
    return len(rows)


async def _apply_terms(db: asyncpg.Connection, user_id: str, account_id: str, t: dict) -> str:
    """Write one account's Sure-sourced terms. Returns 'updated', 'created' or 'needs_min_payment'.

    Sure wins for every value it has; anything it leaves blank keeps what is already in Sovi.
    """
    if t["credit_limit"] is not None:
        await db.execute("UPDATE accounts SET credit_limit=$3 WHERE id=$1 AND user_id=$2",
                         account_id, user_id, t["credit_limit"])
    existing = await db.fetchrow("SELECT min_payment_value FROM debt_metadata WHERE account_id=$1 AND user_id=$2",
                                 account_id, user_id)
    if existing is None:
        if t["apr"] is None or t["min_payment"] is None:
            return "needs_min_payment" if t["apr"] is not None else "updated"
        await db.execute(
            """
            INSERT INTO debt_metadata (account_id, user_id, apr, min_payment_type, min_payment_value,
                                       original_principal, term_months, opened_date, sure_synced_at)
            VALUES ($1, $2, $3, 'fixed', $4, $5, $6, $7, now())
            """,
            account_id, user_id, t["apr"], t["min_payment"], t["original_principal"], t["term_months"], t["opened_date"],
        )
        return "created"
    await db.execute(
        """
        UPDATE debt_metadata SET
          apr = COALESCE($3, apr),
          min_payment_type = CASE WHEN $4::numeric IS NOT NULL THEN 'fixed' ELSE min_payment_type END,
          min_payment_value = COALESCE($4, min_payment_value),
          original_principal = COALESCE($5, original_principal),
          term_months = COALESCE($6, term_months),
          opened_date = COALESCE($7, opened_date),
          sure_synced_at = now()
        WHERE account_id=$1 AND user_id=$2
        """,
        account_id, user_id, t["apr"], t["min_payment"], t["original_principal"], t["term_months"], t["opened_date"],
    )
    return "updated"


async def _sync_details(db: asyncpg.Connection, client: SureClient, user_id: str,
                        owed: dict[str, tuple[str, Decimal]], force: bool) -> None:
    """Read APR, minimum payment and limits through a Sure family export. Never fails the main sync."""
    now = datetime.now(timezone.utc)
    last = await db.fetchval("SELECT details_synced_at FROM sure_credentials WHERE user_id=$1", user_id)
    if last is not None and now - last < (_DETAILS_MIN_GAP if force else _DETAILS_EVERY):
        return
    if not owed:
        return
    note = None
    try:
        export_id = await client.create_export()
        for _ in range(_EXPORT_POLL_TRIES):
            st = await client.export_status(export_id)
            if st.get("status") == "failed":
                raise SureError("Sure could not build the export")
            if st.get("downloadable"):
                break
            await asyncio.sleep(_EXPORT_POLL_SECONDS)
        else:
            raise SureError("Sure did not finish the export in time")
        records = read_account_records(await client.download_export(export_id))
        counts = {"updated": 0, "created": 0, "needs_min_payment": 0}
        for sure_id, (sovi_id, balance_owed) in owed.items():
            rec = records.get(sure_id)
            terms = debt_terms(rec, balance_owed) if rec else None
            if terms:
                counts[await _apply_terms(db, user_id, sovi_id, terms)] += 1
        if counts["needs_min_payment"]:
            note = f"{counts['needs_min_payment']} account(s) have an APR in Sure but no minimum payment; enter it in Sovi or Sure."
    except (SureExportForbidden, SureAuthError):
        note = "APR and limits are not syncing: the Sure key needs read_write scope and an admin Sure user."
    except (SureError, ValueError, KeyError) as exc:
        note = f"Could not read account details from Sure: {str(exc)[:150]}"
        logger.warning("sure details sync user_id=%s: %s", user_id, exc)
    await db.execute("UPDATE sure_credentials SET details_synced_at=now(), details_note=$2 WHERE user_id=$1",
                     user_id, note)


async def sync_user(db: asyncpg.Connection, user_id: str, force: bool = False) -> dict:
    master_key = get_master_key()
    base_url, api_key = await get_credentials(db, user_id, master_key)
    client = SureClient(base_url, api_key)
    del api_key
    stats = {"accounts": 0, "snapshots": 0, "transactions": 0}
    try:
        last = await db.fetchval("SELECT last_sync_at FROM sure_credentials WHERE user_id=$1", user_id)
        since = (last - timedelta(days=_OVERLAP_DAYS)) if last else (datetime.now(timezone.utc) - timedelta(days=_FIRST_SYNC_DAYS))
        since_s = since.strftime("%Y-%m-%d")

        id_map: dict[str, tuple[str, str]] = {}  # sure account id -> (sovi id, classification)
        owed: dict[str, tuple[str, Decimal]] = {}  # liabilities only: sure id -> (sovi id, amount owed now)
        async for acct in client.accounts():
            row = account_row(acct)
            sovi_id = await _upsert_account(db, user_id, row)
            id_map[acct["id"]] = (sovi_id, acct.get("classification", "asset"))
            if acct.get("classification") == "liability":
                owed[acct["id"]] = (sovi_id, abs(row["balance"]))
            stats["accounts"] += 1
            history = [r async for r in client.balances(account_id=acct["id"], start_date=since_s)]
            points = daily_balances(history, acct.get("classification", "asset"))
            if not points:  # no history yet: at least record today's balance
                points = [(datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0), row["balance"])]
            stats["snapshots"] += await _write_snapshots(db, user_id, sovi_id, points)

        by_account: dict[str, list[dict]] = {}
        async for t in client.transactions(start_date=since_s):
            sid = (t.get("account") or {}).get("id")
            if sid in id_map:
                by_account.setdefault(sid, []).append(transaction_row(t))
        for sid, rows in by_account.items():
            stats["transactions"] += await _upsert_transactions(db, user_id, id_map[sid][0], rows)

        await db.execute("UPDATE sure_credentials SET last_sync_at=now(), last_error=NULL, status='active' WHERE user_id=$1", user_id)
        await _sync_details(db, client, user_id, owed, force)
    except SureAuthError:
        await db.execute("UPDATE sure_credentials SET status='auth_failed', last_error='Sure rejected the API key' WHERE user_id=$1", user_id)
        raise
    except SureError as exc:
        await db.execute("UPDATE sure_credentials SET last_error=$2 WHERE user_id=$1", user_id, str(exc)[:200])
        raise
    finally:
        await client.aclose()
    logger.info("sure sync user_id=%s: %s", user_id, stats)
    return stats

from __future__ import annotations

import json
import logging
import sys
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import asyncpg

# Ensure api package is importable when running the worker directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

from app.auth.crypto import get_master_key as _get_master_key
from app.simplefin.client import SimpleFINAuthError, fetch_accounts
from app.simplefin.service import get_access_url, mark_auth_failed
from app.categorization.pipeline import categorize_transaction

logger = logging.getLogger(__name__)

_NINETY_DAYS = 90
_BALANCE_EPSILON = Decimal("0.005")


def _master_key() -> bytes:
    """Decode master key from settings once per worker process."""
    return _get_master_key()


def _epoch_to_timestamptz(epoch: int | float) -> datetime:
    """Convert a Unix epoch (int or float) to a timezone-aware datetime."""
    return datetime.fromtimestamp(epoch, tz=timezone.utc)


def _derive_account_type(sfin_account: dict) -> str:
    """
    Attempt to derive an account type from SimpleFIN org / name hints.
    Falls back to 'other'.
    """
    # SimpleFIN doesn't mandate a type field; use heuristics on the name
    name_lower = (sfin_account.get("name") or "").lower()
    if "credit" in name_lower or "card" in name_lower or "visa" in name_lower or "mastercard" in name_lower:
        return "credit_card"
    if "mortgage" in name_lower or "loan" in name_lower or "heloc" in name_lower:
        return "loan"
    if "saving" in name_lower:
        return "savings"
    if "check" in name_lower:
        return "checking"
    return "other"


def _derive_credit_limit(sfin_account: dict, account_type: str) -> Decimal | None:
    """
    Derive credit limit for credit card accounts.
    credit_limit = balance + available-balance (if available-balance field exists).
    """
    if account_type != "credit_card":
        return None
    available_balance = sfin_account.get("available-balance")
    if available_balance is None:
        return None
    try:
        balance = Decimal(str(sfin_account.get("balance", 0)))
        avail = Decimal(str(available_balance))
        return balance + avail
    except Exception:
        return None


async def _upsert_account(
    db: asyncpg.Connection,
    user_id: str,
    sfin_account: dict,
) -> tuple[str, str]:
    """
    Upsert a SimpleFIN account into the accounts table.
    Returns (account_id, account_type).
    """
    sfin_account_id = sfin_account["id"]
    conn_id = sfin_account.get("org", {}).get("id") or sfin_account.get("org", {}).get("name")
    conn_name = sfin_account.get("org", {}).get("name")
    name = sfin_account.get("name", "Unknown")
    currency = sfin_account.get("currency", "USD")

    account_type = _derive_account_type(sfin_account)
    credit_limit = _derive_credit_limit(sfin_account, account_type)

    row = await db.fetchrow(
        """
        INSERT INTO accounts (id, user_id, sfin_account_id, conn_id, conn_name, name, type,
                              currency, is_manual, credit_limit)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, false, $8)
        ON CONFLICT (user_id, sfin_account_id) DO UPDATE
          SET conn_name    = EXCLUDED.conn_name,
              name         = EXCLUDED.name,
              currency     = EXCLUDED.currency,
              credit_limit = EXCLUDED.credit_limit
        RETURNING id, type
        """,
        user_id,
        sfin_account_id,
        conn_id,
        conn_name,
        name,
        account_type,
        currency,
        credit_limit,
    )
    return str(row["id"]), row["type"]


async def _write_balance_snapshot(
    db: asyncpg.Connection,
    user_id: str,
    account_id: str,
    sfin_account: dict,
) -> tuple[bool, Decimal | None, Decimal | None]:
    """
    Write a balance snapshot only if the balance has changed from the last one.
    Returns (wrote, old_balance, new_balance).
    old_balance is None if there was no prior snapshot.
    new_balance is None if sfin_account has no balance field.
    """
    balance_raw = sfin_account.get("balance")
    if balance_raw is None:
        return False, None, None

    new_balance = Decimal(str(balance_raw))

    available_balance_raw = sfin_account.get("available-balance")
    available_balance = Decimal(str(available_balance_raw)) if available_balance_raw is not None else None

    balance_date_epoch = sfin_account.get("balance-date")
    balance_date: datetime | None = None
    if balance_date_epoch is not None:
        balance_date = _epoch_to_timestamptz(balance_date_epoch)

    # Fetch most recent snapshot
    last_row = await db.fetchrow(
        """
        SELECT balance FROM balance_snapshots
        WHERE account_id = $1
        ORDER BY captured_at DESC
        LIMIT 1
        """,
        account_id,
    )

    old_balance: Decimal | None = None
    if last_row is not None:
        old_balance = Decimal(str(last_row["balance"]))
        if abs(new_balance - old_balance) <= _BALANCE_EPSILON:
            return False, old_balance, new_balance

    await db.execute(
        """
        INSERT INTO balance_snapshots (account_id, user_id, balance, available_balance, balance_date)
        VALUES ($1, $2, $3, $4, $5)
        """,
        account_id,
        user_id,
        new_balance,
        available_balance,
        balance_date,
    )
    return True, old_balance, new_balance


async def _upsert_transactions(
    db: asyncpg.Connection,
    user_id: str,
    account_id: str,
    transactions: list[dict],
) -> tuple[int, list[tuple[str, str, Decimal]]]:
    """
    Upsert transactions for an account.
    Returns (count_of_new_rows, list_of_(txn_id, description, amount) for new rows).
    """
    new_count = 0
    new_txn_ids: list[tuple[str, str, Decimal]] = []
    for txn in transactions:
        sfin_txn_id = txn.get("id", "")
        posted_epoch = txn.get("posted")
        posted: datetime | None = _epoch_to_timestamptz(posted_epoch) if posted_epoch else None
        amount = Decimal(str(txn["amount"]))
        description = txn.get("description", "")
        pending = txn.get("pending", False)
        raw_extra_dict = txn.get("extra")
        raw_extra = json.dumps(raw_extra_dict) if raw_extra_dict else None

        result = await db.fetchrow(
            """
            INSERT INTO transactions
                (id, user_id, account_id, sfin_txn_id, posted, amount, description, pending, raw_extra)
            VALUES
                (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, account_id, sfin_txn_id) DO NOTHING
            RETURNING id
            """,
            user_id,
            account_id,
            sfin_txn_id,
            posted,
            amount,
            description,
            pending,
            raw_extra,
        )
        if result:
            new_count += 1
            new_txn_ids.append((str(result["id"]), description, amount))

    return new_count, new_txn_ids


async def sync_user(user_id: str, ctx: dict) -> dict:
    """
    Full sync for one user:
    1. Get access URL from DB (decrypt)
    2. Determine start_date (last_sync_at from simplefin_credentials, or 90 days ago)
    3. fetch_accounts(access_url, start_date)
    4. Upsert accounts
    5. Write balance snapshots (dedupe: only write if balance changed)
    6. Upsert transactions (dedupe by sfin_txn_id)
    7. Update last_sync_at
    Returns {"accounts": N, "transactions_new": M, "snapshots_written": K}
    """
    pool = ctx.get("pool")
    if pool is None:
        from worker.db import get_pool
        pool = await get_pool()

    async with pool.acquire() as db:
        return await _sync_user_with_conn(db, user_id)


async def _sync_user_with_conn(db: asyncpg.Connection, user_id: str) -> dict:
    """Inner sync logic that operates on a single DB connection."""
    master_key = _master_key()

    # 1. Get and decrypt access URL — never log it
    try:
        access_url = await get_access_url(db, user_id, master_key)
    except ValueError as exc:
        logger.error("sync_user user_id=%s: failed to retrieve credentials: %s", user_id, exc)
        raise

    # 2. Determine start_date
    cred_row = await db.fetchrow(
        "SELECT last_sync_at FROM simplefin_credentials WHERE user_id=$1",
        user_id,
    )
    if cred_row and cred_row["last_sync_at"] is not None:
        start_date = int(cred_row["last_sync_at"].timestamp())
    else:
        cutoff = datetime.now(tz=timezone.utc) - timedelta(days=_NINETY_DAYS)
        start_date = int(cutoff.timestamp())

    # 3. Fetch accounts from SimpleFIN
    try:
        data = await fetch_accounts(access_url, start_date)
    except SimpleFINAuthError:
        logger.warning("sync_user user_id=%s: auth failed, marking credentials as auth_failed", user_id)
        await mark_auth_failed(db, user_id)
        raise
    except Exception:
        logger.exception("sync_user user_id=%s: unexpected error fetching accounts", user_id)
        raise
    finally:
        # Zero out the access URL from local scope ASAP
        del access_url

    sfin_accounts = data.get("accounts", [])
    accounts_processed = 0
    transactions_new = 0
    snapshots_written = 0
    balance_changes: list[dict] = []
    had_payment = False  # heuristic: at least one debt balance decreased

    for sfin_account in sfin_accounts:
        # 4. Upsert account
        try:
            account_id, account_type = await _upsert_account(db, user_id, sfin_account)
        except Exception:
            logger.exception(
                "sync_user user_id=%s: failed to upsert account sfin_id=%s",
                user_id,
                sfin_account.get("id", "<unknown>"),
            )
            continue

        accounts_processed += 1

        # 5. Write balance snapshot (deduplicated)
        try:
            wrote, old_bal, new_bal = await _write_balance_snapshot(db, user_id, account_id, sfin_account)
            if wrote:
                snapshots_written += 1
            if new_bal is not None:
                # Track balance changes for milestone evaluation (use old_bal if available,
                # otherwise treat as unchanged so we don't false-fire milestones on first sync)
                effective_old = old_bal if old_bal is not None else new_bal
                balance_changes.append({
                    "account_id": str(account_id),
                    "name": sfin_account.get("name", "Unknown"),
                    "old_balance": effective_old,
                    "new_balance": new_bal,
                })
                if account_type in ("credit_card", "loan") and old_bal is not None and new_bal < old_bal:
                    had_payment = True
        except Exception:
            logger.exception(
                "sync_user user_id=%s: failed to write balance snapshot account_id=%s",
                user_id,
                account_id,
            )

        # 6. Upsert transactions
        txns = sfin_account.get("transactions", [])
        try:
            new_txn_count, new_txn_ids = await _upsert_transactions(db, user_id, account_id, txns)
            transactions_new += new_txn_count
        except Exception:
            logger.exception(
                "sync_user user_id=%s: failed to upsert transactions for account_id=%s",
                user_id,
                account_id,
            )
            new_txn_ids = []

        # 6b. Categorize newly inserted transactions
        for txn_id, description, amount in new_txn_ids:
            try:
                cat_id, source = await categorize_transaction(db, user_id, txn_id, description, amount)
                if cat_id:
                    await db.execute(
                        "UPDATE transactions SET category_id=$1, category_source=$2 WHERE id=$3",
                        cat_id,
                        source,
                        txn_id,
                    )
            except Exception:
                logger.exception(
                    "sync_user user_id=%s: failed to categorize transaction_id=%s",
                    user_id,
                    txn_id,
                )

    # 7. Update last_sync_at
    await db.execute(
        "UPDATE simplefin_credentials SET last_sync_at=now() WHERE user_id=$1",
        user_id,
    )

    # 8. Evaluate milestones and streaks server-side
    try:
        from worker.milestones import evaluate_milestones, evaluate_streaks
        new_milestones = await evaluate_milestones(
            db, user_id, {"balance_changes": balance_changes}
        )
        if new_milestones:
            logger.info(
                "sync_user user_id=%s: awarded %d milestone(s): %s",
                user_id,
                len(new_milestones),
                new_milestones,
            )
        # on_time heuristic: at least one debt payment was observed
        # overpayment heuristic: check if user has an extra_monthly > 0 in their active scenario
        scenario_row = await db.fetchrow(
            "SELECT extra_monthly FROM scenarios WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
            user_id,
        )
        extra_monthly = (
            Decimal(str(scenario_row["extra_monthly"])) if scenario_row else Decimal("0")
        )
        await evaluate_streaks(
            db,
            user_id,
            on_time=had_payment,
            overpayment=(extra_monthly > 0),
        )
    except Exception:
        logger.exception(
            "sync_user user_id=%s: error evaluating milestones/streaks", user_id
        )

    result = {
        "accounts": accounts_processed,
        "transactions_new": transactions_new,
        "snapshots_written": snapshots_written,
    }
    logger.info("sync_user user_id=%s completed: %s", user_id, result)
    return result

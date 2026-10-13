"""Write Sure-sourced debt terms (APR, minimum payment, limits) into Sovi. Shared by the API and the worker."""
from __future__ import annotations

import asyncpg

from app.sure.details import debt_terms, read_account_records


async def apply_terms(db: asyncpg.Connection, user_id: str, account_id: str, t: dict) -> str:
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


async def apply_export(db: asyncpg.Connection, user_id: str, data: bytes) -> dict:
    """Apply a Sure family export (zip or all.ndjson) the user uploaded. Matches on Sure's account id."""
    records = read_account_records(data)
    if not records:
        raise ValueError("No accounts found in that file. Upload the zip from Sure's Exports page, or its all.ndjson.")
    rows = await db.fetch(
        """
        SELECT a.id, a.external_id, a.name,
               (SELECT balance FROM balance_snapshots s WHERE s.account_id = a.id ORDER BY s.balance_date DESC LIMIT 1) AS bal
        FROM accounts a
        WHERE a.user_id = $1 AND a.source = 'sure' AND a.archived = false AND a.type IN ('credit_card', 'loan')
        ORDER BY a.name
        """,
        user_id,
    )
    out: dict = {"updated": [], "created": [], "needs_min_payment": [], "no_details": [], "accounts_in_export": len(records)}
    for r in rows:
        rec = records.get(r["external_id"])
        owed = abs(r["bal"]) if r["bal"] is not None else 0
        terms = debt_terms(rec, owed) if rec else None
        if not terms:
            out["no_details"].append(r["name"])
            continue
        result = await apply_terms(db, user_id, str(r["id"]), terms)
        out[{"updated": "updated", "created": "created", "needs_min_payment": "needs_min_payment"}[result]].append(r["name"])
    return out

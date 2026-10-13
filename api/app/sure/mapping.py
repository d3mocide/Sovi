"""Pure functions: Sure API payloads -> Sovi rows. No I/O, so they are easy to test.

Conventions (see app/money.py): balances are stored signed (liabilities negative); transaction
amounts are signed with outflow negative, as SimpleFIN reports them.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

SOVI_TYPES = {"checking", "savings", "credit_card", "loan", "investment", "other"}


def cents(n: int | None) -> Decimal:
    return (Decimal(n) / Decimal(100)) if n is not None else Decimal("0")


def account_type(sure: dict[str, Any]) -> str:
    """Map Sure's account_type / subtype / classification to one of Sovi's account types."""
    t = (sure.get("account_type") or "").lower()
    sub = (sure.get("subtype") or "").lower()
    liability = sure.get("classification") == "liability"
    if t == "credit_card":
        return "credit_card"
    if liability:
        return "loan"  # loans, mortgages and other debts all pay down the same way
    if t == "depository":
        return "savings" if ("sav" in sub or "money_market" in sub) else "checking"
    if t in ("investment", "crypto"):
        return "investment"
    return "other"


def signed_balance(sure: dict[str, Any]) -> Decimal:
    """Sure reports what you owe as a positive number on liabilities; store it negative."""
    bal = cents(sure.get("balance_cents"))
    return -abs(bal) if sure.get("classification") == "liability" else bal


def account_row(sure: dict[str, Any]) -> dict[str, Any]:
    return {
        "external_id": sure["id"],
        "name": sure.get("name") or "Unnamed account",
        "type": account_type(sure),
        "subtype": sure.get("subtype"),
        "currency": sure.get("currency") or "USD",
        "institution": sure.get("institution_name"),
        "balance": signed_balance(sure),
    }


def _parse_date(s: str) -> datetime:
    return datetime.strptime(s[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)


def transaction_row(sure: dict[str, Any]) -> dict[str, Any]:
    """signed_amount_cents is negative for expenses and positive for income, on every account type."""
    return {
        "external_id": sure["id"],
        "posted": _parse_date(sure["date"]),
        "amount": cents(sure.get("signed_amount_cents")),
        "description": sure.get("name") or (sure.get("merchant") or {}).get("name") or "",
        "merchant": (sure.get("merchant") or {}).get("name"),
        "ext_category": (sure.get("category") or {}).get("name"),
        "is_transfer": bool(sure.get("transfer")),
        "pending": False,
    }


def daily_balances(rows: list[dict[str, Any]], classification: str) -> list[tuple[datetime, Decimal]]:
    """One signed balance per day (the most recently updated row wins), oldest first."""
    best: dict[str, dict[str, Any]] = {}
    for r in rows:
        d = r["date"][:10]
        if d not in best or (r.get("updated_at") or "") >= (best[d].get("updated_at") or ""):
            best[d] = r
    out = []
    for d in sorted(best):
        bal = cents(best[d].get("balance_cents"))
        out.append((_parse_date(d), -abs(bal) if classification == "liability" else bal))
    return out

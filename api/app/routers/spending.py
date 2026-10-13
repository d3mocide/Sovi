"""Spending analytics: where money goes, and how much of it is funded by credit.

Everything is read-only over data already synced into Sovi. Definitions (per calendar month):
  income        positive, non-transfer amounts on asset accounts (paychecks, interest earned...)
  card_charges  negative, non-transfer amounts on credit cards
  card_refunds  positive, non-transfer amounts on credit cards (returns, statement credits)
  card_payments positive transfers into credit cards (you paying the card)
  cash_spend    negative, non-transfer amounts on asset accounts
  borrowing     card_charges - card_refunds - card_payments  (> 0 means card balances grew from
                spending; card interest is not included because it is not a purchase)
Transfers are excluded from spending everywhere: more than half of the rows are transfers.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends, Query

from app.auth.session import get_current_user
from app.database import get_db

router = APIRouter(prefix="/spending", tags=["spending"])

UNCATEGORIZED = "Uncategorized"


def _month_start(d: date, back: int) -> date:
    y, m = d.year, d.month - back
    while m <= 0:
        m += 12
        y -= 1
    return date(y, m, 1)


@router.get("/monthly")
async def monthly(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[asyncpg.Connection, Depends(get_db)],
    months: int = Query(6, ge=1, le=24),
) -> dict:
    user_id = str(current_user["id"])
    today = date.today()
    start = _month_start(today, months - 1)

    # Category for rows Sure left uncategorized: the one most often used for the same merchant.
    rows = await db.fetch(
        """
        WITH merch AS (
            SELECT merchant, (array_agg(ext_category ORDER BY n DESC))[1] AS cat
            FROM (SELECT merchant, ext_category, count(*) AS n FROM transactions
                  WHERE user_id = $1 AND ext_category IS NOT NULL AND merchant IS NOT NULL
                  GROUP BY merchant, ext_category) x
            GROUP BY merchant
        )
        SELECT date_trunc('month', t.posted)::date AS m,
               a.type AS acct_type, t.is_transfer,
               COALESCE(t.ext_category, mc.cat) AS category,
               (t.ext_category IS NULL AND mc.cat IS NOT NULL) AS learned,
               t.merchant, t.amount
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        LEFT JOIN merch mc ON mc.merchant = t.merchant
        WHERE t.user_id = $1 AND a.archived = false AND t.posted >= $2
        """,
        user_id, start,
    )

    keys = [_month_start(today, i).isoformat() for i in range(months - 1, -1, -1)]
    flow = {k: defaultdict(float) for k in keys}
    cat_month: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    cat_card: dict[str, float] = defaultdict(float)
    cat_total: dict[str, float] = defaultdict(float)
    merchants: dict[str, float] = defaultdict(float)
    learned_spend = 0.0

    for r in rows:
        k = r["m"].isoformat()
        if k not in flow:
            continue
        amt = float(r["amount"])
        is_card = r["acct_type"] == "credit_card"
        is_liab = r["acct_type"] in ("credit_card", "loan")
        f = flow[k]
        if r["is_transfer"]:
            if is_card and amt > 0:
                f["card_payments"] += amt
            continue
        if is_liab and not is_card:
            continue  # loan interest/fees are cost of debt, not spending categories
        if amt > 0:
            if is_card:
                f["card_refunds"] += amt
                spend_delta = -amt
            else:
                f["income"] += amt
                continue
        else:
            spend_delta = -amt
            f["card_charges" if is_card else "cash_spend"] += spend_delta
        cat = r["category"] or UNCATEGORIZED
        cat_month[cat][k] += spend_delta
        cat_total[cat] += spend_delta
        if is_card:
            cat_card[cat] += spend_delta
        if cat == UNCATEGORIZED and r["merchant"]:
            merchants[r["merchant"]] += spend_delta
        if r["learned"]:
            learned_spend += spend_delta

    out_months = []
    for k in keys:
        f = flow[k]
        out_months.append({
            "month": k,
            "partial": k == _month_start(today, 0).isoformat(),
            "income": round(f["income"], 2),
            "cash_spend": round(f["cash_spend"], 2),
            "card_charges": round(f["card_charges"] - f["card_refunds"], 2),
            "card_payments": round(f["card_payments"], 2),
            "spend": round(f["cash_spend"] + f["card_charges"] - f["card_refunds"], 2),
            "borrowing": round(f["card_charges"] - f["card_refunds"] - f["card_payments"], 2),
        })

    categories = []
    full = [k for k in keys if k != _month_start(today, 0).isoformat()] or keys
    for cat, total in sorted(cat_total.items(), key=lambda kv: -kv[1]):
        per = cat_month[cat]
        categories.append({
            "name": cat,
            "total": round(total, 2),
            "avg_month": round(sum(per.get(k, 0.0) for k in full) / len(full), 2),
            "by_month": {k: round(per.get(k, 0.0), 2) for k in keys},
            "card_share": round(cat_card[cat] / total, 3) if total else 0.0,
        })

    total_spend = sum(cat_total.values()) or 1.0
    return {
        "months": out_months,
        "categories": categories,
        "uncategorized_share": round(cat_total.get(UNCATEGORIZED, 0.0) / total_spend, 3),
        "learned_share": round(learned_spend / total_spend, 3),
        "top_uncategorized_merchants": [
            {"merchant": m, "total": round(v, 2)} for m, v in sorted(merchants.items(), key=lambda kv: -kv[1])[:8]
        ],
    }

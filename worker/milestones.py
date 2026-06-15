from __future__ import annotations

import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

MILESTONE_TYPES = {
    "debt_paid": "Debt paid off: {name}",
    "principal_1k": "${amount}k of principal gone on {name}",
    "account_closed": "Account closed: {name}",
}


async def evaluate_milestones(db, user_id: str, sync_result: dict) -> list[dict]:
    """
    Called after each sync. Checks for newly paid-off debts and principal milestones.
    sync_result contains {account_id, name, old_balance, new_balance} entries.
    Awards milestones server-side; returns list of new milestone dicts.
    """
    awarded = []
    for entry in sync_result.get("balance_changes", []):
        account_id = entry["account_id"]
        name = entry["name"]
        old_balance = Decimal(str(entry["old_balance"]))
        new_balance = Decimal(str(entry["new_balance"]))

        # debt_paid: balance crossed zero
        if old_balance > 0 and new_balance == 0:
            existing = await db.fetchrow(
                "SELECT id FROM milestones WHERE user_id=$1 AND type='debt_paid' AND meta->>'account_id'=$2",
                user_id,
                account_id,
            )
            if not existing:
                await db.execute(
                    """INSERT INTO milestones (user_id, type, label, meta)
                       VALUES ($1, 'debt_paid', $2, $3::jsonb)""",
                    user_id,
                    f"Paid off: {name}",
                    {"account_id": account_id, "name": name},
                )
                awarded.append({"type": "debt_paid", "account_id": account_id})
                logger.info(
                    "evaluate_milestones user_id=%s: awarded debt_paid for account_id=%s name=%s",
                    user_id,
                    account_id,
                    name,
                )

        # principal_1k: every $1k of principal reduction
        if old_balance > new_balance:
            paid_down = old_balance - new_balance
            # Check original principal from debt_metadata
            dm = await db.fetchrow(
                "SELECT original_principal FROM debt_metadata WHERE account_id=$1 AND user_id=$2",
                account_id,
                user_id,
            )
            if dm and dm["original_principal"]:
                original = Decimal(str(dm["original_principal"]))
                total_paid = original - new_balance
                # Award for each $1000 threshold crossed
                for threshold in range(1000, int(float(original)) + 1000, 1000):
                    t = Decimal(str(threshold))
                    if total_paid >= t and (total_paid - paid_down) < t:
                        existing = await db.fetchrow(
                            "SELECT id FROM milestones WHERE user_id=$1 AND type='principal_1k' AND meta->>'account_id'=$2 AND (meta->>'threshold')::int=$3",
                            user_id,
                            account_id,
                            threshold,
                        )
                        if not existing:
                            await db.execute(
                                """INSERT INTO milestones (user_id, type, label, meta)
                                   VALUES ($1, 'principal_1k', $2, $3::jsonb)""",
                                user_id,
                                f"${threshold // 1000}k paid down on {name}",
                                {
                                    "account_id": account_id,
                                    "name": name,
                                    "threshold": threshold,
                                },
                            )
                            awarded.append(
                                {
                                    "type": "principal_1k",
                                    "account_id": account_id,
                                    "threshold": threshold,
                                }
                            )
                            logger.info(
                                "evaluate_milestones user_id=%s: awarded principal_1k $%dk for account_id=%s",
                                user_id,
                                threshold // 1000,
                                account_id,
                            )
    return awarded


async def evaluate_streaks(
    db, user_id: str, on_time: bool, overpayment: bool
) -> None:
    """
    Update streak counters after a sync cycle.
    on_time: True if all due payments were covered this month.
    overpayment: True if extra_monthly > 0 was paid.
    """
    for streak_type, condition in [("on_time", on_time), ("overpayment", overpayment)]:
        row = await db.fetchrow(
            "SELECT id, current_count, longest FROM streaks WHERE user_id=$1 AND type=$2",
            user_id,
            streak_type,
        )
        if row:
            if condition:
                new_count = row["current_count"] + 1
                new_longest = max(row["longest"], new_count)
                await db.execute(
                    "UPDATE streaks SET current_count=$1, longest=$2, last_event_at=now() WHERE id=$3",
                    new_count,
                    new_longest,
                    row["id"],
                )
            else:
                await db.execute(
                    "UPDATE streaks SET current_count=0 WHERE id=$1",
                    row["id"],
                )
        else:
            await db.execute(
                """INSERT INTO streaks (user_id, type, current_count, longest, last_event_at)
                   VALUES ($1, $2, $3, $3, now())""",
                user_id,
                streak_type,
                1 if condition else 0,
            )

from decimal import Decimal
from typing import Optional
import re


async def apply_rules(db, user_id: str, description: str, amount: Decimal) -> Optional[str]:
    """
    Run the rules engine for a single transaction.
    Returns category_id (str UUID) or None if no rule matches.

    Rules are matched in priority order (lower number = higher priority).
    match_type values: 'merchant' (substring, case-insensitive), 'regex', 'amount'
    """
    rows = await db.fetch(
        """
        SELECT id, match_type, pattern, category_id
        FROM categorization_rules
        WHERE user_id = $1
        ORDER BY priority ASC, created_at ASC
        """,
        user_id
    )
    for row in rows:
        if _matches(row["match_type"], row["pattern"], description, amount):
            return str(row["category_id"])
    return None


def _matches(match_type: str, pattern: str, description: str, amount: Decimal) -> bool:
    if match_type == "merchant":
        return pattern.lower() in description.lower()
    elif match_type == "regex":
        try:
            return bool(re.search(pattern, description, re.IGNORECASE))
        except re.error:
            return False
    elif match_type == "amount":
        try:
            return abs(amount) == abs(Decimal(pattern))
        except Exception:
            return False
    return False

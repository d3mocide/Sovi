import logging
from decimal import Decimal
from typing import Optional

from .rules import apply_rules
from .ai import categorize_with_ai
from ..config import settings

logger = logging.getLogger(__name__)


async def categorize_transaction(
    db,
    user_id: str,
    transaction_id: str,
    description: str,
    amount: Decimal,
) -> tuple[Optional[str], str]:  # (category_id, source)
    """
    Run the full categorization pipeline for one transaction.
    Returns (category_id_or_None, source) where source is 'rule'|'ai'|'uncategorized'.
    Does NOT write to DB — caller writes.
    """
    # Step 1: rules engine
    category_id = await apply_rules(db, user_id, description, amount)
    if category_id:
        return category_id, "rule"

    # Step 2: AI fallback
    # Fetch user's category names for the prompt
    rows = await db.fetch(
        "SELECT id, name FROM categories WHERE user_id = $1 ORDER BY name",
        user_id
    )
    if rows:
        name_to_id = {row["name"]: str(row["id"]) for row in rows}
        category_names = list(name_to_id.keys())

        ai_name = await categorize_with_ai(
            description,
            category_names,
            litellm_url=settings.LITELLM_URL,
            litellm_key=settings.LITELLM_KEY,
        )
        if ai_name and ai_name in name_to_id:
            return name_to_id[ai_name], "ai"

    return None, "uncategorized"

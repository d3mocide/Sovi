import httpx
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def categorize_with_ai(
    description: str,
    category_names: list[str],
    litellm_url: str,
    litellm_key: str,
) -> Optional[str]:
    """
    Call LiteLLM to categorize a transaction description.
    Returns the category name (must be in category_names) or None.
    Uses local Llama 3 first; LiteLLM handles fallback to Claude.
    """
    if not category_names:
        return None

    categories_list = "\n".join(f"- {c}" for c in category_names)
    prompt = (
        f"Categorize this transaction: \"{description}\"\n\n"
        f"Choose exactly one category from this list:\n{categories_list}\n\n"
        f"Respond with only the category name, nothing else. "
        f"If none fit, respond with \"Uncategorized\"."
    )

    payload = {
        "model": "ollama/llama3",   # LiteLLM routes to local Llama 3; falls back to claude on error
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 50,
        "temperature": 0,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{litellm_url}/chat/completions",
                headers={"Authorization": f"Bearer {litellm_key}", "Content-Type": "application/json"},
                content=json.dumps(payload),
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"]["content"].strip()
            # Only return if it matches a known category
            for name in category_names:
                if raw.lower() == name.lower():
                    return name
            if raw.lower() == "uncategorized":
                return None
            # Fuzzy fallback: return None if we can't confirm
            return None
    except Exception as e:
        logger.warning("AI categorization failed for '%s': %s", description[:50], str(e))
        return None

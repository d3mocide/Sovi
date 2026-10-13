"""Balance sign convention.

`balance_snapshots.balance` stores the *signed* balance as the institution reports it: assets are
positive, liabilities (credit cards, loans) are negative. Anything that needs "how much do I owe"
goes through `owed()`, so a source that reports debt as a positive number (Sure) is normalised once,
at import, and the rest of the app never has to guess.
"""
from __future__ import annotations

from decimal import Decimal

LIABILITY_TYPES = ("credit_card", "loan")


def is_liability(account_type: str) -> bool:
    return account_type in LIABILITY_TYPES


def owed(signed_balance: Decimal | None) -> Decimal:
    """Amount owed on a liability account: 0 when the card is in credit or has no balance yet."""
    if signed_balance is None:
        return Decimal("0")
    return max(-Decimal(str(signed_balance)), Decimal("0"))


def to_signed(account_type: str, amount: Decimal) -> Decimal:
    """Store a user-entered amount: for a liability, what the user types is what they owe."""
    amount = Decimal(str(amount))
    return -abs(amount) if is_liability(account_type) else amount

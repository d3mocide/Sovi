from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, field_validator


class ConnectRequest(BaseModel):
    setup_url: str

    @field_validator("setup_url")
    @classmethod
    def must_be_https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("setup_url must start with https://")
        return v


class ConnectResponse(BaseModel):
    status: str


class StatusResponse(BaseModel):
    connected: bool
    status: str | None
    last_sync_at: datetime | None


class ManualAccountRequest(BaseModel):
    name: str
    type: Literal["checking", "savings", "credit_card", "loan", "investment", "asset", "other"]
    currency: str = "USD"
    credit_limit: Decimal | None = None
    initial_balance: Decimal | None = None


class AccountResponse(BaseModel):
    id: str
    name: str
    type: str
    currency: str
    is_manual: bool
    credit_limit: Decimal | None
    latest_balance: Decimal | None
    balance_date: datetime | None
    needs_update: bool = False  # True for manual accounts with no balance snapshot in last 30 days
    needs_classification: bool = False  # True if type=='other' and came from SimpleFIN
    has_debt_metadata: bool = False  # True if a debt_metadata row exists for this account


class BalanceRequest(BaseModel):
    """What the user sees on their statement: for a card or loan, the amount they owe."""
    balance: Decimal


class UpdateAccountRequest(BaseModel):
    name: str | None = None
    type: Literal["checking", "savings", "credit_card", "loan", "investment", "asset", "other"] | None = None
    credit_limit: Decimal | None = None
    archived: bool | None = None

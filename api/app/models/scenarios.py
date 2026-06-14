from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel


class ScenarioCreate(BaseModel):
    name: Optional[str] = None
    strategy: Literal["avalanche", "snowball", "custom"]
    extra_monthly: Decimal
    custom_order: Optional[list[str]] = None


class ScenarioResponse(BaseModel):
    id: str
    name: Optional[str]
    strategy: str
    extra_monthly: Decimal
    custom_order: Optional[list[str]]
    created_at: datetime

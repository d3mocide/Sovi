from typing import Optional, Literal
from decimal import Decimal
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str]
    icon: Optional[str]
    color: Optional[str]


class RuleCreate(BaseModel):
    match_type: Literal["merchant", "regex", "amount"]
    pattern: str
    category_id: str
    priority: int = 100


class RuleResponse(BaseModel):
    id: str
    match_type: str
    pattern: str
    category_id: str
    priority: int

from pydantic import BaseModel
from typing import Optional
from datetime import date


class CreateTransactionRequest(BaseModel):
    merchant: str
    category: str
    amount: float
    type: str
    date: date
    account: str
    note: Optional[str] = None


class UpdateTransactionRequest(BaseModel):
    merchant: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    date: Optional[date] = None
    account: Optional[str] = None
    note: Optional[str] = None


class TransactionOut(BaseModel):
    id: str
    merchant: str
    category: str
    amount: float
    type: str
    date: str
    account: str
    note: Optional[str] = None

    model_config = {"from_attributes": True}

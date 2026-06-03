from pydantic import BaseModel
from typing import List, Optional


class TransactionCreate(BaseModel):
    items: List[str]  # list of product names
    date: Optional[str] = None


class TransactionItemResponse(BaseModel):
    product_name: str
    quantity: int
    price: float


class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    date: str
    items: List[str]
    total: float
    status: str

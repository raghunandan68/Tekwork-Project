from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    status: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float
    stock: int
    sold: int
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AddStockRequest(BaseModel):
    quantity: int

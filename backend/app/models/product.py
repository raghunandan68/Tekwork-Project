from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock: int
    seasonality: Optional[str] = "Year-Round"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    status: Optional[str] = None
    seasonality: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float
    stock: int
    sold: int
    status: str
    seasonality: Optional[str] = "Year-Round"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AddStockRequest(BaseModel):
    quantity: int

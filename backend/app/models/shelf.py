from pydantic import BaseModel
from typing import List, Optional


class ShelfZoneResponse(BaseModel):
    id: int
    zone: str
    color: str
    bg: str
    icon: str
    desc: str
    products: List[str]
    avgSales: int


class UpdateZoneProducts(BaseModel):
    products: List[str]

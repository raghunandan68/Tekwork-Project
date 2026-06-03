"""Inventory router — stock levels, summary, add stock."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.services import inventory_service
from app.models.product import AddStockRequest

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/summary")
async def inventory_summary(user_id: str = Depends(get_current_user)):
    return inventory_service.get_inventory_summary(user_id)


@router.get("/stock-levels")
async def stock_levels(user_id: str = Depends(get_current_user)):
    return inventory_service.get_stock_levels(user_id)


@router.post("/{product_id}/add-stock")
async def add_stock(product_id: int, body: AddStockRequest,
                    user_id: str = Depends(get_current_user)):
    result = inventory_service.add_stock(user_id, product_id, body.quantity)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found.")
    return result

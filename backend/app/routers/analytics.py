"""Analytics router — deep-dive charts and reports."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/revenue-trend")
async def revenue_trend(user_id: str = Depends(get_current_user)):
    return analytics_service.get_revenue_trend(user_id)


@router.get("/top-products")
async def top_products(user_id: str = Depends(get_current_user)):
    return analytics_service.get_top_products(user_id)


@router.get("/category-sales")
async def category_sales(user_id: str = Depends(get_current_user)):
    return analytics_service.get_category_sales(user_id)


@router.get("/lift-heatmap")
async def lift_heatmap(user_id: str = Depends(get_current_user)):
    return analytics_service.get_lift_heatmap(user_id)


@router.get("/inventory-report")
async def inventory_report(user_id: str = Depends(get_current_user)):
    return analytics_service.get_inventory_report(user_id)

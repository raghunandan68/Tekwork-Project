"""Dashboard router — summary KPIs, sales trend, category distribution."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user)):
    return dashboard_service.get_summary(user_id)


@router.get("/sales-trend")
async def sales_trend(user_id: str = Depends(get_current_user)):
    return dashboard_service.get_sales_trend(user_id)


@router.get("/category-distribution")
async def category_distribution(user_id: str = Depends(get_current_user)):
    return dashboard_service.get_category_distribution(user_id)

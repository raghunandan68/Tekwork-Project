"""Recommendations router — AI-powered suggestions."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/cross-sell")
async def cross_sell(user_id: str = Depends(get_current_user)):
    return recommendation_service.get_cross_sell_recommendations(user_id)


@router.get("/restock")
async def restock(user_id: str = Depends(get_current_user)):
    return recommendation_service.get_restock_recommendations(user_id)


@router.get("/shelf-placement")
async def shelf_placement(user_id: str = Depends(get_current_user)):
    return recommendation_service.get_shelf_placement_recommendations(user_id)

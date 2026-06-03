"""Shelves router — shelf zone management."""

from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.services import shelf_service
from app.models.shelf import UpdateZoneProducts

router = APIRouter(prefix="/shelves", tags=["Shelves"])


@router.get("/zones")
async def get_zones(user_id: str = Depends(get_current_user)):
    return shelf_service.get_shelf_zones(user_id)


@router.put("/zones/{zone_id}")
async def update_zone(zone_id: int, body: UpdateZoneProducts,
                      user_id: str = Depends(get_current_user)):
    result = shelf_service.update_zone_products(user_id, zone_id, body.products)
    if not result:
        raise HTTPException(status_code=404, detail="Zone not found.")
    return result

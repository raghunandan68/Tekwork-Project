"""Products router — CRUD for product management."""

from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth import get_current_user
from app.services import product_service
from app.models.product import ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("")
async def list_products(search: str = Query("", description="Search by name or category"),
                        user_id: str = Depends(get_current_user)):
    return product_service.get_all_products(user_id, search)


@router.post("")
async def create_product(body: ProductCreate, user_id: str = Depends(get_current_user)):
    result = product_service.create_product(user_id, body.model_dump())
    if not result:
        raise HTTPException(status_code=400, detail="Failed to create product.")
    return result


@router.put("/{product_id}")
async def update_product(product_id: int, body: ProductUpdate,
                         user_id: str = Depends(get_current_user)):
    result = product_service.update_product(user_id, product_id, body.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Product not found.")
    return result


@router.delete("/{product_id}")
async def delete_product(product_id: int, user_id: str = Depends(get_current_user)):
    result = product_service.delete_product(user_id, product_id)
    return {"deleted": True}

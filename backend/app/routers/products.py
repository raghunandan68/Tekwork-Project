"""Products router — CRUD, CSV/Excel bulk upload, and category management."""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from app.auth import get_current_user
from app.services import product_service
from app.models.product import ProductCreate, ProductUpdate
from app.upload_utils import parse_upload, coerce_row

router = APIRouter(prefix="/products", tags=["Products"])

SEASONALITY_OPTIONS = ["Year-Round", "Summer", "Winter", "Monsoon", "Festive", "Weekend Peak"]


# ── CRUD ─────────────────────────────────────────────────────────────────────

@router.get("")
async def list_products(search: str = Query("", description="Search by name or category"),
                        user_id: str = Depends(get_current_user)):
    return product_service.get_all_products(user_id, search)


@router.post("")
async def create_product(body: ProductCreate, user_id: str = Depends(get_current_user)):
    # Auto-save the category if it's a new one (non-fatal if it fails)
    try:
        product_service.save_category(body.category)
    except Exception:
        pass
    result = product_service.create_product(user_id, body.model_dump())
    if not result:
        raise HTTPException(status_code=400, detail="Failed to create product.")
    return result


@router.put("/{product_id}")
async def update_product(product_id: int, body: ProductUpdate,
                         user_id: str = Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)
    # Auto-save new category if provided
    if "category" in data and data["category"]:
        product_service.save_category(data["category"])
    result = product_service.update_product(user_id, product_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found.")
    return result


@router.delete("/{product_id}")
async def delete_product(product_id: int, user_id: str = Depends(get_current_user)):
    product_service.delete_product(user_id, product_id)
    return {"deleted": True}


# ── Bulk Upload ───────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_products(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Bulk-import products from a CSV or Excel file.

    Required columns: name, category, price, stock
    Optional columns: seasonality

    Returns a summary: { imported, skipped, errors }
    """
    rows = await parse_upload(file, required_columns=["name", "category", "price", "stock"])

    imported = 0
    skipped = 0
    errors = []

    for idx, raw in enumerate(rows, start=2):  # start=2 because row 1 is header
        try:
            row = coerce_row(raw, {
                "name":        "name",
                "category":    "category",
                "price":       "price",
                "stock":       "stock",
                "seasonality": "seasonality",
            })

            name = row.get("name", "").strip()
            category = row.get("category", "").strip()
            price_str = row.get("price", "").strip()
            stock_str = row.get("stock", "").strip()
            seasonality = row.get("seasonality", "").strip() or "Year-Round"

            # Validate
            if not name:
                raise ValueError("name is empty")
            if not category:
                raise ValueError("category is empty")
            price = float(price_str)
            stock = int(stock_str)
            if price < 0:
                raise ValueError("price must be >= 0")
            if stock < 0:
                raise ValueError("stock must be >= 0")
            if seasonality not in SEASONALITY_OPTIONS:
                seasonality = "Year-Round"

            data = {
                "name": name,
                "category": category,
                "price": price,
                "stock": stock,
                "seasonality": seasonality,
            }

            # Save category & create product
            product_service.save_category(category)
            product_service.create_product(user_id, data)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {idx}: {str(e)}")

    return {"imported": imported, "skipped": skipped, "errors": errors}


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories(user_id: str = Depends(get_current_user)):
    """Return all available category names."""
    return product_service.get_categories()


@router.post("/categories")
async def add_category(body: dict, user_id: str = Depends(get_current_user)):
    """Add a new custom category."""
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required.")
    product_service.save_category(name)
    return {"name": name}

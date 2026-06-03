"""Inventory business logic — stock levels, alerts, restocking."""

from app.database import get_supabase


def get_inventory_summary(user_id: str):
    """Return aggregate inventory KPIs."""
    db = get_supabase()
    products = (
        db.table("products")
        .select("stock")
        .eq("user_id", user_id)
        .execute()
    )
    items = products.data
    total_products = len(items)
    total_stock = sum(p["stock"] for p in items)
    low_stock = sum(1 for p in items if p["stock"] < 10)
    well_stocked = sum(1 for p in items if p["stock"] >= 50)

    return {
        "total_products": total_products,
        "total_stock_units": total_stock,
        "low_stock_count": low_stock,
        "well_stocked_count": well_stocked,
    }


def get_stock_levels(user_id: str):
    """Return all products with their stock levels for charting."""
    db = get_supabase()
    result = (
        db.table("products")
        .select("id, name, category, stock, sold, price, status")
        .eq("user_id", user_id)
        .order("stock")
        .execute()
    )
    return result.data


def add_stock(user_id: str, product_id: int, quantity: int):
    """Add stock to a product and update its status."""
    db = get_supabase()

    # Get current stock
    product = (
        db.table("products")
        .select("stock")
        .eq("user_id", user_id)
        .eq("id", product_id)
        .single()
        .execute()
    )
    if not product.data:
        return None

    new_stock = product.data["stock"] + quantity
    new_status = "Low Stock" if new_stock < 10 else "Active"

    result = (
        db.table("products")
        .update({"stock": new_stock, "status": new_status})
        .eq("id", product_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None

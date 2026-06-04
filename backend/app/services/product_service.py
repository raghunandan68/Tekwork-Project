"""Product business logic — CRUD operations on the products table."""

from app.database import get_supabase


def get_all_products(user_id: str, search: str = ""):
    """Return all products for a user, optionally filtered by name/category."""
    db = get_supabase()
    query = db.table("products").select("*").eq("user_id", user_id).order("id")

    if search:
        query = query.or_(f"name.ilike.%{search}%,category.ilike.%{search}%")

    result = query.execute()
    return result.data


def get_product_by_id(user_id: str, product_id: int):
    """Return a single product by ID scoped to user."""
    db = get_supabase()
    result = (
        db.table("products")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", product_id)
        .single()
        .execute()
    )
    return result.data


def create_product(user_id: str, data: dict):
    """Insert a new product for a user."""
    db = get_supabase()
    row = {
        "user_id": user_id,
        "name": data["name"],
        "category": data["category"],
        "price": data["price"],
        "stock": data["stock"],
        "sold": 0,
        "status": "Low Stock" if data["stock"] < 10 else "Active",
        "seasonality": data.get("seasonality", "Year-Round"),
    }
    try:
        result = db.table("products").insert(row).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        # Fallback: if seasonality column doesn't exist yet, insert without it
        if "seasonality" in str(e):
            row_without_season = {k: v for k, v in row.items() if k != "seasonality"}
            result = db.table("products").insert(row_without_season).execute()
            return result.data[0] if result.data else None
        raise


def update_product(user_id: str, product_id: int, data: dict):
    """Partially update a product."""
    db = get_supabase()
    update_fields = {k: v for k, v in data.items() if v is not None}

    # Auto-set status based on stock level if stock is being updated
    if "stock" in update_fields:
        stock = update_fields["stock"]
        if "status" not in update_fields:
            update_fields["status"] = "Low Stock" if stock < 10 else "Active"

    try:
        result = (
            db.table("products")
            .update(update_fields)
            .eq("user_id", user_id)
            .eq("id", product_id)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        # Fallback: if seasonality column doesn't exist yet, update without it
        if "seasonality" in str(e):
            update_fields.pop("seasonality", None)
            result = (
                db.table("products")
                .update(update_fields)
                .eq("user_id", user_id)
                .eq("id", product_id)
                .execute()
            )
            return result.data[0] if result.data else None
        raise


def delete_product(user_id: str, product_id: int):
    """Delete a product scoped to user."""
    db = get_supabase()
    result = (
        db.table("products")
        .delete()
        .eq("user_id", user_id)
        .eq(  "id", product_id)
        .execute()
    )
    return result.data


# ── Category helpers ──────────────────────────────────────────────────────────

def get_categories():
    """Return all category names from the shared categories table."""
    db = get_supabase()
    result = db.table("categories").select("name").order("name").execute()
    return [row["name"] for row in result.data]


def save_category(name: str):
    """Insert a new category if it doesn't already exist. Returns the name."""
    try:
        db = get_supabase()
        db.table("categories").upsert({"name": name}, on_conflict="name").execute()
    except Exception:
        pass  # Non-fatal — categories table may not be set up yet
    return name

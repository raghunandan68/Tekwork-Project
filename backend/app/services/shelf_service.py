"""Shelf zone business logic — zone CRUD and product placement."""

from app.database import get_supabase


def get_shelf_zones(user_id: str):
    """Return all shelf zones with their products."""
    db = get_supabase()

    zones = (
        db.table("shelf_zones")
        .select("*")
        .eq("user_id", user_id)
        .order("id")
        .execute()
    )

    results = []
    for zone in zones.data:
        # Get products in this zone, ordered by position
        products = (
            db.table("shelf_zone_products")
            .select("product_name")
            .eq("zone_id", zone["id"])
            .order("position")
            .execute()
        )
        product_names = [p["product_name"] for p in products.data]

        results.append({
            "id": zone["id"],
            "zone": zone["zone_name"],
            "color": zone["color"],
            "bg": zone["bg_color"],
            "icon": zone["icon"],
            "desc": zone["description"] or "",
            "products": product_names,
            "avgSales": zone["avg_sales"],
        })

    return results


def update_zone_products(user_id: str, zone_id: int, products: list[str]):
    """Replace all products in a shelf zone."""
    db = get_supabase()

    # Verify the zone belongs to the user
    zone = (
        db.table("shelf_zones")
        .select("id")
        .eq("user_id", user_id)
        .eq("id", zone_id)
        .single()
        .execute()
    )
    if not zone.data:
        return None

    # Delete existing products in this zone
    db.table("shelf_zone_products").delete().eq("zone_id", zone_id).execute()

    # Insert new products
    for i, product_name in enumerate(products):
        db.table("shelf_zone_products").insert({
            "zone_id": zone_id,
            "product_name": product_name,
            "position": i + 1,
        }).execute()

    return {"zone_id": zone_id, "products": products}

"""Recommendation business logic — cross-sell, restock, shelf placement."""

from app.database import get_supabase


def get_cross_sell_recommendations(user_id: str):
    db = get_supabase()
    rules = (
        db.table("association_rules")
        .select("antecedent, consequent, confidence, lift, strength")
        .eq("user_id", user_id)
        .order("confidence", desc=True)
        .limit(10)
        .execute()
    )
    return [
        {
            "antecedent": r["antecedent"],
            "consequent": r["consequent"],
            "confidence": f"{float(r['confidence']) * 100:.0f}%",
            "lift": float(r["lift"]),
            "strength": r["strength"],
        }
        for r in rules.data
    ]


def get_restock_recommendations(user_id: str):
    db = get_supabase()
    recs = (
        db.table("restock_recommendations")
        .select("*")
        .eq("user_id", user_id)
        .order("days_left")
        .execute()
    )
    return [
        {
            "product": r["product_name"],
            "stock": r["current_stock"],
            "avgDailySales": float(r["avg_daily_sales"]),
            "daysLeft": float(r["days_left"]),
            "priority": r["priority"],
        }
        for r in recs.data
    ]


def get_shelf_placement_recommendations(user_id: str):
    db = get_supabase()
    rules = (
        db.table("association_rules")
        .select("antecedent, consequent, confidence, lift, strength")
        .eq("user_id", user_id)
        .order("lift", desc=True)
        .execute()
    )
    products = (
        db.table("products")
        .select("name, sold")
        .eq("user_id", user_id)
        .execute()
    )
    sales_map = {p["name"]: p["sold"] for p in products.data}

    seen = set()
    placements = []
    for rule in rules.data:
        ant, cons = rule["antecedent"], rule["consequent"]
        pair_key = tuple(sorted([ant, cons]))
        if pair_key in seen:
            continue
        seen.add(pair_key)

        cluster = [ant, cons]
        for other in rules.data:
            if other["antecedent"] in cluster and other["consequent"] not in cluster and float(other["lift"]) >= 1.3:
                cluster.append(other["consequent"])
            elif other["consequent"] in cluster and other["antecedent"] not in cluster and float(other["lift"]) >= 1.3:
                cluster.append(other["antecedent"])

        total_units = sum(sales_map.get(p, 0) for p in cluster)
        lift_val = float(rule["lift"])
        priority = "Cross-Sell Endcap" if lift_val >= 2.0 else "Premium Shelf" if lift_val >= 1.5 else "Adjacent Shelf"

        placements.append({
            "products": cluster[:4],
            "reason": f"Lift {lift_val}x, {float(rule['confidence'])*100:.0f}% confidence — {rule['strength'].lower()} association",
            "priority": priority,
            "totalUnitsSold": total_units,
        })
        if len(placements) >= 5:
            break

    return placements

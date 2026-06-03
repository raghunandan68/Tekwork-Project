"""Analytics business logic — revenue trends, top products, lift heatmap, inventory report."""

from app.database import get_supabase


def get_revenue_trend(user_id: str):
    db = get_supabase()
    result = (
        db.table("sales_trends")
        .select("month, year, sales")
        .eq("user_id", user_id)
        .order("year")
        .order("id")
        .execute()
    )
    return [{"month": r["month"], "sales": float(r["sales"])} for r in result.data]


def get_top_products(user_id: str, limit: int = 6):
    db = get_supabase()
    result = (
        db.table("products")
        .select("name, sold")
        .eq("user_id", user_id)
        .order("sold", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


def get_category_sales(user_id: str):
    db = get_supabase()
    products = (
        db.table("products")
        .select("category, sold")
        .eq("user_id", user_id)
        .execute()
    )
    cat_totals = {}
    for p in products.data:
        cat_totals[p["category"]] = cat_totals.get(p["category"], 0) + p["sold"]
    total = sum(cat_totals.values()) or 1
    return [
        {"name": cat, "value": round((sold / total) * 100)}
        for cat, sold in sorted(cat_totals.items(), key=lambda x: -x[1])
    ]


def get_lift_heatmap(user_id: str):
    db = get_supabase()
    rules = (
        db.table("association_rules")
        .select("antecedent, consequent, lift")
        .eq("user_id", user_id)
        .order("lift", desc=True)
        .execute()
    )
    return [
        {
            "antecedent": r["antecedent"],
            "consequent": r["consequent"],
            "lift": float(r["lift"]),
        }
        for r in rules.data
    ]


def get_inventory_report(user_id: str):
    db = get_supabase()
    products = (
        db.table("products")
        .select("id, name, category, stock, sold, price, status")
        .eq("user_id", user_id)
        .order("stock")
        .execute()
    )
    report = []
    for p in products.data:
        daily_sales = round(p["sold"] / 30, 1) if p["sold"] > 0 else 0
        days_left = round(p["stock"] / daily_sales, 1) if daily_sales > 0 else 999
        stock_status = "Critical" if p["stock"] < 10 else "Low" if p["stock"] < 30 else "Good"
        report.append({
            "name": p["name"],
            "category": p["category"],
            "stock": p["stock"],
            "sold": p["sold"],
            "revenue": round(float(p["price"]) * p["sold"], 2),
            "stockStatus": stock_status,
            "daysLeft": days_left,
        })
    return report

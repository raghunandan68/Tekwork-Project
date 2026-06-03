"""Dashboard business logic — summary KPIs, sales trends, category distribution."""

from app.database import get_supabase


def get_summary(user_id: str):
    """Return top-level KPI data for the dashboard."""
    db = get_supabase()

    # Total products
    products = db.table("products").select("id, stock, sold, price").eq("user_id", user_id).execute()
    total_products = len(products.data)
    stock_alerts = sum(1 for p in products.data if p["stock"] < 10)

    # Today's revenue (from transactions)
    from datetime import date
    today = date.today().isoformat()
    today_txns = (
        db.table("transactions")
        .select("total")
        .eq("user_id", user_id)
        .eq("date", today)
        .execute()
    )
    today_revenue = sum(float(t["total"]) for t in today_txns.data)

    # Total transactions today
    txn_count_today = len(today_txns.data)

    # Total association rules
    rules = db.table("association_rules").select("id").eq("user_id", user_id).execute()
    rules_count = len(rules.data)

    # Total revenue (all time)
    all_txns = db.table("transactions").select("total").eq("user_id", user_id).execute()
    total_revenue = sum(float(t["total"]) for t in all_txns.data)
    total_txn_count = len(all_txns.data)

    return {
        "total_products": total_products,
        "stock_alerts": stock_alerts,
        "today_revenue": today_revenue,
        "txn_count_today": txn_count_today,
        "rules_count": rules_count,
        "total_revenue": total_revenue,
        "total_transactions": total_txn_count,
    }


def get_sales_trend(user_id: str):
    """Return monthly sales trend data."""
    db = get_supabase()
    result = (
        db.table("sales_trends")
        .select("month, year, sales")
        .eq("user_id", user_id)
        .order("year")
        .order("id")
        .execute()
    )
    return [
        {"month": row["month"], "sales": float(row["sales"])}
        for row in result.data
    ]


def get_category_distribution(user_id: str):
    """Return sales distribution by category (% of total sold units)."""
    db = get_supabase()
    products = (
        db.table("products")
        .select("category, sold")
        .eq("user_id", user_id)
        .execute()
    )

    # Aggregate sold units by category
    category_totals = {}
    for p in products.data:
        cat = p["category"]
        category_totals[cat] = category_totals.get(cat, 0) + p["sold"]

    total_sold = sum(category_totals.values()) or 1  # avoid division by zero

    return [
        {"name": cat, "value": round((sold / total_sold) * 100)}
        for cat, sold in sorted(category_totals.items(), key=lambda x: -x[1])
    ]

"""Market basket analysis business logic — Apriori algorithm & association rules."""

from itertools import combinations
from collections import defaultdict
from app.database import get_supabase


def get_analysis_summary(user_id: str):
    """Return analysis KPIs: rule count, avg confidence, avg lift, transactions analyzed."""
    db = get_supabase()

    rules = (
        db.table("association_rules")
        .select("confidence, lift")
        .eq("user_id", user_id)
        .execute()
    )
    txns = (
        db.table("transactions")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )

    rules_data = rules.data
    rules_count = len(rules_data)
    avg_confidence = (
        sum(float(r["confidence"]) for r in rules_data) / rules_count
        if rules_count > 0
        else 0
    )
    avg_lift = (
        sum(float(r["lift"]) for r in rules_data) / rules_count
        if rules_count > 0
        else 0
    )

    return {
        "rules_count": rules_count,
        "avg_confidence": f"{avg_confidence * 100:.0f}%",
        "avg_lift": f"{avg_lift:.1f}",
        "transactions_analyzed": len(txns.data),
    }


def get_association_rules(user_id: str):
    """Return all stored association rules."""
    db = get_supabase()
    result = (
        db.table("association_rules")
        .select("*")
        .eq("user_id", user_id)
        .order("lift", desc=True)
        .execute()
    )

    return [
        {
            "id": r["id"],
            "antecedent": r["antecedent"],
            "consequent": r["consequent"],
            "support": f"{float(r['support']) * 100:.0f}%",
            "confidence": f"{float(r['confidence']) * 100:.0f}%",
            "lift": float(r["lift"]),
            "strength": r["strength"],
        }
        for r in result.data
    ]


def run_analysis(user_id: str, min_support: float = 0.2, min_confidence: float = 0.5):
    """
    Run Apriori market basket analysis on the user's transaction data.
    Computes association rules and stores them in the database.
    """
    db = get_supabase()

    # 1. Fetch all transactions with their items
    txns = (
        db.table("transactions")
        .select("id")
        .eq("user_id", user_id)
        .execute()
    )
    if not txns.data:
        return {"rules_generated": 0, "message": "No transactions to analyze."}

    # Build list of item-sets (baskets)
    baskets = []
    for txn in txns.data:
        items = (
            db.table("transaction_items")
            .select("product_name")
            .eq("transaction_id", txn["id"])
            .execute()
        )
        item_set = frozenset(item["product_name"] for item in items.data)
        if len(item_set) >= 2:
            baskets.append(item_set)

    total_baskets = len(baskets)
    if total_baskets == 0:
        return {"rules_generated": 0, "message": "Not enough multi-item transactions."}

    # 2. Count item frequencies
    item_counts = defaultdict(int)
    for basket in baskets:
        for item in basket:
            item_counts[item] += 1

    # Frequent single items
    frequent_items = {
        item for item, count in item_counts.items()
        if count / total_baskets >= min_support
    }

    # 3. Count pairs
    pair_counts = defaultdict(int)
    for basket in baskets:
        frequent_in_basket = basket & frequent_items
        for pair in combinations(sorted(frequent_in_basket), 2):
            pair_counts[pair] += 1

    # 4. Generate association rules
    rules = []
    for (item_a, item_b), pair_count in pair_counts.items():
        support = pair_count / total_baskets
        if support < min_support:
            continue

        # A -> B
        confidence_ab = pair_count / item_counts[item_a]
        lift_ab = confidence_ab / (item_counts[item_b] / total_baskets) if item_counts[item_b] > 0 else 0

        if confidence_ab >= min_confidence:
            strength = _classify_strength(lift_ab)
            rules.append({
                "antecedent": item_a,
                "consequent": item_b,
                "support": round(support, 4),
                "confidence": round(confidence_ab, 4),
                "lift": round(lift_ab, 2),
                "strength": strength,
            })

        # B -> A
        confidence_ba = pair_count / item_counts[item_b]
        lift_ba = confidence_ba / (item_counts[item_a] / total_baskets) if item_counts[item_a] > 0 else 0

        if confidence_ba >= min_confidence:
            strength = _classify_strength(lift_ba)
            rules.append({
                "antecedent": item_b,
                "consequent": item_a,
                "support": round(support, 4),
                "confidence": round(confidence_ba, 4),
                "lift": round(lift_ba, 2),
                "strength": strength,
            })

    # 5. Clear old rules and insert new ones
    db.table("association_rules").delete().eq("user_id", user_id).execute()

    for rule in rules:
        db.table("association_rules").insert({
            "user_id": user_id,
            **rule,
        }).execute()

    # 6. Also update restock recommendations while we're at it
    _update_restock_recommendations(user_id)

    return {
        "rules_generated": len(rules),
        "transactions_analyzed": total_baskets,
        "message": f"Analysis complete. {len(rules)} rules discovered from {total_baskets} transactions.",
    }


def _classify_strength(lift: float) -> str:
    """Classify the strength of an association rule based on lift."""
    if lift >= 2.0:
        return "Very High"
    elif lift >= 1.5:
        return "High"
    elif lift >= 1.2:
        return "Medium"
    else:
        return "Low"


def _update_restock_recommendations(user_id: str):
    """Recalculate restock recommendations based on current stock and sales velocity."""
    db = get_supabase()

    products = (
        db.table("products")
        .select("name, stock, sold")
        .eq("user_id", user_id)
        .execute()
    )

    # Clear old recommendations
    db.table("restock_recommendations").delete().eq("user_id", user_id).execute()

    for p in products.data:
        avg_daily_sales = round(p["sold"] / 30, 2) if p["sold"] > 0 else 0.01
        days_left = round(p["stock"] / avg_daily_sales, 1) if avg_daily_sales > 0 else 999

        if days_left >= 30:
            priority = "Good"
        elif days_left >= 5:
            priority = "Watch"
        else:
            priority = "Critical"

        # Only store items that need attention (days_left < 30)
        if days_left < 30:
            db.table("restock_recommendations").insert({
                "user_id": user_id,
                "product_name": p["name"],
                "current_stock": p["stock"],
                "avg_daily_sales": avg_daily_sales,
                "days_left": days_left,
                "priority": priority,
            }).execute()

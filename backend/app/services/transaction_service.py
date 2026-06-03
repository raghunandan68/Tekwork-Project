"""Transaction business logic — recording sales and retrieving history."""

import uuid
from datetime import date
from app.database import get_supabase


def get_all_transactions(user_id: str):
    """Return all transactions with their items for a user."""
    db = get_supabase()

    # Fetch transactions ordered by date descending
    txns = (
        db.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .order("id", desc=True)
        .execute()
    )

    results = []
    for txn in txns.data:
        # Get items for this transaction
        items = (
            db.table("transaction_items")
            .select("product_name, quantity, price")
            .eq("transaction_id", txn["id"])
            .execute()
        )
        item_names = [item["product_name"] for item in items.data]
        results.append({
            "id": txn["id"],
            "transaction_id": txn["transaction_id"],
            "date": txn["date"],
            "items": item_names,
            "total": float(txn["total"]),
            "status": txn["status"],
        })

    return results


def create_transaction(user_id: str, items: list[str], txn_date: str = None):
    """
    Record a new sale: create a transaction, insert items, update product sold/stock counts.
    `items` is a list of product names.
    """
    db = get_supabase()

    # Generate a unique transaction ID
    txn_id = f"T{uuid.uuid4().hex[:8].upper()}"
    sale_date = txn_date or date.today().isoformat()

    # Look up product details for the items
    products = (
        db.table("products")
        .select("id, name, price, stock, sold")
        .eq("user_id", user_id)
        .in_("name", items)
        .execute()
    )
    product_map = {p["name"]: p for p in products.data}

    # Calculate total
    total = sum(product_map[name]["price"] for name in items if name in product_map)

    # Insert the transaction
    txn_result = (
        db.table("transactions")
        .insert({
            "user_id": user_id,
            "transaction_id": txn_id,
            "date": sale_date,
            "total": float(total),
            "status": "Completed",
        })
        .execute()
    )
    txn_row = txn_result.data[0]

    # Insert transaction items and update product stock/sold
    for name in items:
        if name not in product_map:
            continue
        product = product_map[name]

        # Insert transaction item
        db.table("transaction_items").insert({
            "transaction_id": txn_row["id"],
            "product_id": product["id"],
            "product_name": name,
            "quantity": 1,
            "price": float(product["price"]),
        }).execute()

        # Update product: decrement stock, increment sold
        new_stock = max(product["stock"] - 1, 0)
        new_sold = product["sold"] + 1
        new_status = "Low Stock" if new_stock < 10 else "Active"

        db.table("products").update({
            "stock": new_stock,
            "sold": new_sold,
            "status": new_status,
        }).eq("id", product["id"]).execute()

    return {
        "id": txn_row["id"],
        "transaction_id": txn_id,
        "date": sale_date,
        "items": items,
        "total": float(total),
        "status": "Completed",
    }

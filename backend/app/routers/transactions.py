"""Transactions router — record sales, view history, and CSV/Excel bulk upload."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.auth import get_current_user
from app.services import transaction_service, product_service
from app.models.transaction import TransactionCreate
from app.upload_utils import parse_upload, coerce_row

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ── Standard endpoints ────────────────────────────────────────────────────────

@router.get("")
async def list_transactions(user_id: str = Depends(get_current_user)):
    return transaction_service.get_all_transactions(user_id)


@router.post("")
async def create_transaction(body: TransactionCreate,
                             user_id: str = Depends(get_current_user)):
    return transaction_service.create_transaction(user_id, body.items, body.date)


# ── Bulk Upload ───────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_transactions(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Bulk-import transactions from a CSV or Excel file.

    Required columns: date, product_name, quantity
    Rows with the same date are grouped into one transaction.
    If any product_name in a group is NOT found in the DB, that
    entire group is marked invalid and skipped.

    Returns: { imported, skipped, errors }
    """
    rows = await parse_upload(
        file, required_columns=["date", "product_name", "quantity"]
    )

    # ── Step 1: Group rows by date ────────────────────────────────────────────
    groups: dict[str, list[str]] = {}   # date -> [product_name, ...]
    row_errors: dict[str, str] = {}     # date -> error reason

    for idx, raw in enumerate(rows, start=2):
        row = coerce_row(raw, {
            "date":         "date",
            "product_name": "product_name",
            "quantity":     "quantity",
        })

        date_val    = row.get("date", "").strip()
        product_val = row.get("product_name", "").strip()
        qty_str     = row.get("quantity", "1").strip() or "1"

        if not date_val:
            row_errors.setdefault(f"row_{idx}", f"Row {idx}: missing date")
            continue
        if not product_val:
            row_errors.setdefault(f"row_{idx}", f"Row {idx}: missing product_name")
            continue

        try:
            qty = int(float(qty_str))
            if qty < 1:
                raise ValueError("quantity must be >= 1")
        except ValueError as e:
            row_errors.setdefault(f"row_{idx}", f"Row {idx} ({product_val}): {e}")
            continue

        if date_val not in groups:
            groups[date_val] = []
        # Add product name qty times (existing service takes a list of names)
        groups[date_val].extend([product_val] * qty)

    # ── Step 2: Validate products exist in DB ─────────────────────────────────
    # Collect all unique product names needed
    all_needed = set(name for items in groups.values() for name in items)
    existing_products = product_service.get_all_products(user_id, search="")
    existing_names = {p["name"] for p in existing_products}

    # ── Step 3: Create transactions ───────────────────────────────────────────
    imported = 0
    skipped = 0
    errors = list(row_errors.values())

    for date_val, item_list in groups.items():
        missing = [name for name in set(item_list) if name not in existing_names]
        if missing:
            skipped += 1
            errors.append(
                f"Transaction on {date_val}: product(s) not found in DB — "
                f"{', '.join(missing)}. Transaction skipped."
            )
            continue

        try:
            transaction_service.create_transaction(user_id, item_list, date_val)
            imported += 1
        except Exception as e:
            skipped += 1
            errors.append(f"Transaction on {date_val}: {str(e)}")

    return {"imported": imported, "skipped": skipped, "errors": errors}

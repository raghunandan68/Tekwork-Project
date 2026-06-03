"""Transactions router — record sales and view history."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.services import transaction_service
from app.models.transaction import TransactionCreate

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("")
async def list_transactions(user_id: str = Depends(get_current_user)):
    return transaction_service.get_all_transactions(user_id)


@router.post("")
async def create_transaction(body: TransactionCreate,
                             user_id: str = Depends(get_current_user)):
    return transaction_service.create_transaction(user_id, body.items, body.date)

"""Analysis router — market basket analysis endpoints."""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.services import analysis_service

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.get("/summary")
async def analysis_summary(user_id: str = Depends(get_current_user)):
    return analysis_service.get_analysis_summary(user_id)


@router.get("/association-rules")
async def association_rules(user_id: str = Depends(get_current_user)):
    return analysis_service.get_association_rules(user_id)


@router.post("/run")
async def run_analysis(user_id: str = Depends(get_current_user)):
    return analysis_service.run_analysis(user_id)

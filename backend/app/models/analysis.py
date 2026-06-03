from pydantic import BaseModel
from typing import Optional


class AssociationRuleResponse(BaseModel):
    id: int
    antecedent: str
    consequent: str
    support: str  # formatted as percentage
    confidence: str  # formatted as percentage
    lift: float
    strength: str


class AnalysisSummary(BaseModel):
    rules_count: int
    avg_confidence: str
    avg_lift: str
    transactions_analyzed: int

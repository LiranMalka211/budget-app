from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.insight import AiInsightOut
from app.services import insight_service

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("", response_model=list[AiInsightOut])
def list_insights(user: CurrentUser, db: DbSession) -> list[AiInsightOut]:
    """Lists stored insights for the user's budget, newest first."""
    return [AiInsightOut.model_validate(i) for i in insight_service.list_insights(db, user)]


@router.post("/generate", response_model=list[AiInsightOut], status_code=201)
def generate_insights(user: CurrentUser, db: DbSession) -> list[AiInsightOut]:
    """Analyses the current month and stores fresh insights."""
    return [AiInsightOut.model_validate(i) for i in insight_service.generate_insights(db, user)]

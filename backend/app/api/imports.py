from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.imports import CommitImportInput, ImportResult
from app.services import import_service

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("", response_model=ImportResult, status_code=201)
def commit_import(data: CommitImportInput, user: CurrentUser, db: DbSession) -> ImportResult:
    """Persists reviewed rows from a bank/credit file, skipping duplicates."""
    return import_service.commit_import(db, user, data)

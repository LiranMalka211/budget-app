from datetime import datetime

from app.schemas.base import CamelModel


class AiInsightOut(CamelModel):
    """An insight as returned to the client."""

    id: str
    title: str
    body: str
    user_id: str
    created_at: datetime

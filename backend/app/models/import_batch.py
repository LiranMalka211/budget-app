from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.common import new_id, utcnow


class ImportBatch(Base):
    """Record of one uploaded bank/credit file and how many rows it produced."""

    __tablename__ = "import_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    file_name: Mapped[str] = mapped_column(String(255))
    source: Mapped[str] = mapped_column(String(20))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

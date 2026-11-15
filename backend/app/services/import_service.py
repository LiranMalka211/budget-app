from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.import_batch import ImportBatch
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.imports import CommitImportInput, ImportResult
from app.services.scope import visible_transactions
from app.services.seed import (
    DEFAULT_EXPENSE_CATEGORY_ID,
    DEFAULT_INCOME_CATEGORY_ID,
    TYPE_EXPENSE_ID,
    TYPE_INCOME_ID,
)


def _dup_key(d, amount: Decimal, title: str) -> tuple:
    """Key used to detect a row that already exists: same date, amount and (normalised) title."""
    return (d, amount.quantize(Decimal("0.01")), title.strip().lower())


def commit_import(db: Session, user: User, data: CommitImportInput) -> ImportResult:
    """Inserts the reviewed rows as transactions, skipping ones that duplicate an existing transaction."""
    existing = db.scalars(visible_transactions(user)).all()
    seen = {_dup_key(t.date, Decimal(t.amount), t.title) for t in existing}
    inserted = 0
    skipped = 0
    for row in data.rows:
        amount = Decimal(str(abs(row.amount)))
        key = _dup_key(row.date, amount, row.title)
        if key in seen:
            skipped += 1
            continue
        seen.add(key)
        is_income = row.type == "income"
        db.add(
            Transaction(
                date=row.date,
                title=row.title.strip(),
                amount=amount,
                user_id=user.id,
                category_id=row.category_id or (DEFAULT_INCOME_CATEGORY_ID if is_income else DEFAULT_EXPENSE_CATEGORY_ID),
                type_id=TYPE_INCOME_ID if is_income else TYPE_EXPENSE_ID,
                family_id=user.family_id,
                source="import",
            )
        )
        inserted += 1
    batch = ImportBatch(file_name=data.file_name, source=data.source, row_count=inserted, user_id=user.id)
    db.add(batch)
    db.commit()
    return ImportResult(batch_id=batch.id, inserted=inserted, skipped_duplicates=skipped)

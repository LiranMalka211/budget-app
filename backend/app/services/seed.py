from sqlalchemy.orm import Session

from app.models.category import Category, TransactionType

TYPE_INCOME_ID = "type_income"
TYPE_EXPENSE_ID = "type_expense"

# (id, i18n name key, type id, icon). `name` keys match the frontend's `categories.*` translations.
BUILTIN_CATEGORIES: list[tuple[str, str, str, str]] = [
    ("cat_salary", "salary", TYPE_INCOME_ID, "Briefcase"),
    ("cat_bonus", "bonus", TYPE_INCOME_ID, "Gift"),
    ("cat_other_income", "otherIncome", TYPE_INCOME_ID, "Plus"),
    ("cat_groceries", "groceries", TYPE_EXPENSE_ID, "ShoppingCart"),
    ("cat_rent", "rent", TYPE_EXPENSE_ID, "Home"),
    ("cat_utilities", "utilities", TYPE_EXPENSE_ID, "Zap"),
    ("cat_transport", "transport", TYPE_EXPENSE_ID, "Car"),
    ("cat_dining", "dining", TYPE_EXPENSE_ID, "Utensils"),
    ("cat_entertainment", "entertainment", TYPE_EXPENSE_ID, "Film"),
    ("cat_health", "health", TYPE_EXPENSE_ID, "HeartPulse"),
    ("cat_education", "education", TYPE_EXPENSE_ID, "GraduationCap"),
    ("cat_shopping", "shopping", TYPE_EXPENSE_ID, "ShoppingBag"),
    ("cat_insurance", "insurance", TYPE_EXPENSE_ID, "Shield"),
    ("cat_savings", "savings", TYPE_EXPENSE_ID, "PiggyBank"),
    ("cat_other_expense", "otherExpense", TYPE_EXPENSE_ID, "MoreHorizontal"),
]

DEFAULT_EXPENSE_CATEGORY_ID = "cat_other_expense"
DEFAULT_INCOME_CATEGORY_ID = "cat_other_income"


def seed_lookups(db: Session) -> None:
    """Inserts the two transaction types and the built-in categories if they are missing (idempotent)."""
    for type_id, key in ((TYPE_INCOME_ID, "income"), (TYPE_EXPENSE_ID, "expense")):
        if db.get(TransactionType, type_id) is None:
            db.add(TransactionType(id=type_id, type=key))
    for cat_id, name, type_id, icon in BUILTIN_CATEGORIES:
        if db.get(Category, cat_id) is None:
            db.add(Category(id=cat_id, name=name, type_id=type_id, icon=icon, is_builtin=True))
    db.commit()

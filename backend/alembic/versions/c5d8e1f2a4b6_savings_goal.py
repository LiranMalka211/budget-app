"""monthly savings goal

Revision ID: c5d8e1f2a4b6
Revises: 7a4e9c2b1d33
Create Date: 2026-11-18 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c5d8e1f2a4b6'
down_revision: Union[str, None] = '7a4e9c2b1d33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ('families', 'users'):
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.add_column(sa.Column('savings_goal', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    for table in ('families', 'users'):
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.drop_column('savings_goal')

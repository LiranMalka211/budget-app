"""insight language

Revision ID: 3f1c2a9d7b10
Revises: 82dcf83b0aad
Create Date: 2026-11-17 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '3f1c2a9d7b10'
down_revision: Union[str, None] = '82dcf83b0aad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('ai_insights', schema=None) as batch_op:
        batch_op.add_column(sa.Column('language', sa.String(length=5), server_default='en', nullable=False))
        batch_op.create_index(batch_op.f('ix_ai_insights_language'), ['language'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('ai_insights', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_ai_insights_language'))
        batch_op.drop_column('language')

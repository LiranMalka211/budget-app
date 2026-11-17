"""family member edit permission

Revision ID: 7a4e9c2b1d33
Revises: 3f1c2a9d7b10
Create Date: 2026-11-17 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '7a4e9c2b1d33'
down_revision: Union[str, None] = '3f1c2a9d7b10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('family_members', schema=None) as batch_op:
        batch_op.add_column(sa.Column('can_edit', sa.Boolean(), server_default=sa.false(), nullable=False))
    op.execute(
        "UPDATE family_members SET can_edit = true WHERE EXISTS (SELECT 1 FROM families f "
        "WHERE f.id = family_members.family_id AND f.head_user_id = family_members.user_id)"
    )


def downgrade() -> None:
    with op.batch_alter_table('family_members', schema=None) as batch_op:
        batch_op.drop_column('can_edit')

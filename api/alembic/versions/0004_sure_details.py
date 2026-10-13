"""Sure account details (APR, minimum payment, limits) read from Sure's family export

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-13
"""
from __future__ import annotations

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE sure_credentials ADD COLUMN details_synced_at TIMESTAMPTZ")
    op.execute("ALTER TABLE sure_credentials ADD COLUMN details_note TEXT")
    # Set when the row's values were last taken from Sure (they are overwritten on the next details sync).
    op.execute("ALTER TABLE debt_metadata ADD COLUMN sure_synced_at TIMESTAMPTZ")


def downgrade() -> None:
    op.execute("ALTER TABLE debt_metadata DROP COLUMN IF EXISTS sure_synced_at")
    op.execute("ALTER TABLE sure_credentials DROP COLUMN IF EXISTS details_note")
    op.execute("ALTER TABLE sure_credentials DROP COLUMN IF EXISTS details_synced_at")

"""Sure as a data source: credentials, account/transaction source columns

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-13
"""
from __future__ import annotations

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE sure_credentials (
            user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            base_url      TEXT NOT NULL,
            api_key_enc   BYTEA NOT NULL,
            data_key_enc  BYTEA NOT NULL,
            status        TEXT NOT NULL DEFAULT 'active',
            last_sync_at  TIMESTAMPTZ,
            last_error    TEXT,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    # Where each account came from. For source='sure', external_id is Sure's account id;
    # for 'simplefin' the id stays in sfin_account_id.
    op.execute("ALTER TABLE accounts ADD COLUMN source TEXT NOT NULL DEFAULT 'simplefin'")
    op.execute("UPDATE accounts SET source = 'manual' WHERE is_manual")
    op.execute("ALTER TABLE accounts ADD COLUMN external_id TEXT")
    op.execute("ALTER TABLE accounts ADD COLUMN institution TEXT")
    op.execute("ALTER TABLE accounts ADD COLUMN subtype TEXT")
    op.execute("""
        CREATE UNIQUE INDEX accounts_source_external_uq
            ON accounts (user_id, source, external_id) WHERE external_id IS NOT NULL
    """)
    # Transactions: for source='sure', sfin_txn_id holds Sure's transaction id (unique per account).
    op.execute("ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'simplefin'")
    op.execute("ALTER TABLE transactions ADD COLUMN merchant TEXT")
    op.execute("ALTER TABLE transactions ADD COLUMN ext_category TEXT")
    op.execute("ALTER TABLE transactions ADD COLUMN is_transfer BOOLEAN NOT NULL DEFAULT false")
    op.execute("CREATE INDEX transactions_user_posted_idx ON transactions (user_id, posted)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS transactions_user_posted_idx")
    for col in ("is_transfer", "ext_category", "merchant", "source"):
        op.execute(f"ALTER TABLE transactions DROP COLUMN IF EXISTS {col}")
    op.execute("DROP INDEX IF EXISTS accounts_source_external_uq")
    for col in ("subtype", "institution", "external_id", "source"):
        op.execute(f"ALTER TABLE accounts DROP COLUMN IF EXISTS {col}")
    op.execute("DROP TABLE IF EXISTS sure_credentials")

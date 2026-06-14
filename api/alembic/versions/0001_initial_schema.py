"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-14
"""
from __future__ import annotations

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE")
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.execute("""
        CREATE TABLE users (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email           CITEXT UNIQUE NOT NULL,
            password_hash   TEXT NOT NULL,
            totp_secret_enc BYTEA,
            totp_enabled    BOOLEAN NOT NULL DEFAULT false,
            display_name    TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE simplefin_credentials (
            user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            access_url_enc   BYTEA NOT NULL,
            data_key_enc     BYTEA NOT NULL,
            status           TEXT NOT NULL DEFAULT 'active',
            last_sync_at     TIMESTAMPTZ,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE accounts (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            sfin_account_id  TEXT,
            conn_id          TEXT,
            conn_name        TEXT,
            name             TEXT NOT NULL,
            type             TEXT NOT NULL,
            currency         TEXT NOT NULL DEFAULT 'USD',
            is_manual        BOOLEAN NOT NULL DEFAULT false,
            credit_limit     NUMERIC(14,2),
            archived         BOOLEAN NOT NULL DEFAULT false,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (user_id, sfin_account_id)
        )
    """)

    op.execute("""
        CREATE TABLE balance_snapshots (
            account_id        UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            user_id           UUID NOT NULL,
            balance           NUMERIC(14,2) NOT NULL,
            available_balance NUMERIC(14,2),
            balance_date      TIMESTAMPTZ NOT NULL,
            captured_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    # TimescaleDB hypertable — partition by captured_at
    op.execute(
        "SELECT create_hypertable('balance_snapshots', 'captured_at')"
    )

    op.execute("""
        CREATE TABLE categories (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name       TEXT NOT NULL,
            parent_id  UUID REFERENCES categories(id),
            icon       TEXT,
            color      TEXT
        )
    """)

    op.execute("""
        CREATE TABLE transactions (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            sfin_txn_id      TEXT NOT NULL,
            posted           TIMESTAMPTZ,
            amount           NUMERIC(14,2) NOT NULL,
            description      TEXT NOT NULL,
            pending          BOOLEAN NOT NULL DEFAULT false,
            category_id      UUID REFERENCES categories(id),
            category_source  TEXT,
            raw_extra        JSONB,
            UNIQUE (user_id, account_id, sfin_txn_id)
        )
    """)

    op.execute("""
        CREATE TABLE debt_metadata (
            account_id         UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
            user_id            UUID NOT NULL,
            apr                NUMERIC(6,3) NOT NULL,
            min_payment_type   TEXT NOT NULL,
            min_payment_value  NUMERIC(14,2) NOT NULL,
            min_payment_floor  NUMERIC(14,2),
            statement_due_day  SMALLINT,
            original_principal NUMERIC(14,2),
            term_months        INT,
            opened_date        DATE
        )
    """)

    op.execute("""
        CREATE TABLE categorization_rules (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            match_type  TEXT NOT NULL,
            pattern     TEXT NOT NULL,
            category_id UUID NOT NULL REFERENCES categories(id),
            priority    INT NOT NULL DEFAULT 100
        )
    """)

    op.execute("""
        CREATE TABLE scenarios (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name          TEXT,
            strategy      TEXT NOT NULL,
            extra_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
            custom_order  JSONB,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE milestones (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type        TEXT NOT NULL,
            label       TEXT NOT NULL,
            achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            meta        JSONB
        )
    """)

    op.execute("""
        CREATE TABLE streaks (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type          TEXT NOT NULL,
            current_count INT NOT NULL DEFAULT 0,
            longest       INT NOT NULL DEFAULT 0,
            last_event_at TIMESTAMPTZ
        )
    """)

    # Indexes
    op.execute("CREATE INDEX ON transactions (user_id, posted)")
    op.execute("CREATE INDEX ON transactions (user_id, category_id)")
    op.execute("CREATE INDEX ON balance_snapshots (account_id, captured_at DESC)")
    op.execute("CREATE INDEX ON accounts (user_id, type)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS streaks CASCADE")
    op.execute("DROP TABLE IF EXISTS milestones CASCADE")
    op.execute("DROP TABLE IF EXISTS scenarios CASCADE")
    op.execute("DROP TABLE IF EXISTS categorization_rules CASCADE")
    op.execute("DROP TABLE IF EXISTS debt_metadata CASCADE")
    op.execute("DROP TABLE IF EXISTS transactions CASCADE")
    op.execute("DROP TABLE IF EXISTS categories CASCADE")
    op.execute("DROP TABLE IF EXISTS balance_snapshots CASCADE")
    op.execute("DROP TABLE IF EXISTS accounts CASCADE")
    op.execute("DROP TABLE IF EXISTS simplefin_credentials CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")

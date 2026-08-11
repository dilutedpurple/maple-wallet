"""create transactions table

Revision ID: 20260811_0001
Revises:
Create Date: 2026-08-11
"""
from collections.abc import Sequence

from alembic import op
from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, Integer, String
from sqlalchemy import Column, text
from sqlalchemy.dialects import postgresql


revision: str = "20260811_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

transaction_type = postgresql.ENUM(
    "INCOME",
    "EXPENSE",
    name="transaction_type",
    create_type=False,
)


def upgrade() -> None:
    transaction_type.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "transactions",
        Column("id", Integer(), nullable=False, primary_key=True),
        Column("type", transaction_type, nullable=False),
        Column("category", String(length=50), nullable=False),
        Column("amount", BigInteger(), nullable=False),
        Column("description", String(length=500), nullable=True),
        Column("transaction_date", Date(), nullable=False),
        Column(
            "created_at",
            DateTime(timezone=True),
            server_default=text("now()"),
            nullable=False,
        ),
        Column(
            "updated_at",
            DateTime(timezone=True),
            server_default=text("now()"),
            nullable=False,
        ),
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
    )
    op.create_index("ix_transactions_type", "transactions", ["type"])
    op.create_index("ix_transactions_category", "transactions", ["category"])
    op.create_index(
        "ix_transactions_transaction_date",
        "transactions",
        ["transaction_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_transactions_transaction_date", table_name="transactions")
    op.drop_index("ix_transactions_category", table_name="transactions")
    op.drop_index("ix_transactions_type", table_name="transactions")
    op.drop_table("transactions")
    transaction_type.drop(op.get_bind(), checkfirst=True)

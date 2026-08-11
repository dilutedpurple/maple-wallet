from datetime import date, datetime
from enum import Enum

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy import Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class TransactionType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[TransactionType] = mapped_column(
        SQLAlchemyEnum(TransactionType, name="transaction_type"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

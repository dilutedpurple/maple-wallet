from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def create_transaction(db: Session, data: TransactionCreate) -> Transaction:
    transaction = Transaction(**data.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transactions(
    db: Session,
    *,
    limit: int,
    offset: int,
    transaction_type: TransactionType | None = None,
    category: str | None = None,
) -> list[Transaction]:
    statement: Select[tuple[Transaction]] = select(Transaction)
    if transaction_type is not None:
        statement = statement.where(Transaction.type == transaction_type)
    if category is not None:
        statement = statement.where(Transaction.category == category.strip().upper())
    statement = statement.order_by(
        Transaction.transaction_date.desc(),
        Transaction.id.desc(),
    ).offset(offset).limit(limit)
    return list(db.scalars(statement).all())


def get_transaction(db: Session, transaction_id: int) -> Transaction | None:
    return db.get(Transaction, transaction_id)


def update_transaction(
    db: Session,
    transaction: Transaction,
    data: TransactionUpdate,
) -> Transaction:
    for field_name, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, field_name, value)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: Transaction) -> None:
    db.delete(transaction)
    db.commit()

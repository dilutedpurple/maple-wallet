from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.services import transactions as transaction_service


router = APIRouter(prefix="/api/transactions", tags=["transactions"])
DatabaseSession = Annotated[Session, Depends(get_db)]


def _database_error(db: Session, exc: SQLAlchemyError) -> HTTPException:
    db.rollback()
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="데이터베이스 요청을 처리할 수 없습니다.",
    )


def _require_transaction(db: Session, transaction_id: int) -> Transaction:
    try:
        transaction = transaction_service.get_transaction(db, transaction_id)
    except SQLAlchemyError as exc:
        raise _database_error(db, exc) from exc
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="가계부 내역을 찾을 수 없습니다.",
        )
    return transaction


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(data: TransactionCreate, db: DatabaseSession) -> Transaction:
    try:
        return transaction_service.create_transaction(db, data)
    except SQLAlchemyError as exc:
        raise _database_error(db, exc) from exc


@router.get("", response_model=list[TransactionResponse])
def get_transactions(
    db: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    transaction_type: Annotated[TransactionType | None, Query(alias="type")] = None,
    category: Annotated[str | None, Query(min_length=1, max_length=50)] = None,
) -> list[Transaction]:
    try:
        return transaction_service.get_transactions(
            db,
            limit=limit,
            offset=offset,
            transaction_type=transaction_type,
            category=category,
        )
    except SQLAlchemyError as exc:
        raise _database_error(db, exc) from exc


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: DatabaseSession) -> Transaction:
    return _require_transaction(db, transaction_id)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: DatabaseSession,
) -> Transaction:
    transaction = _require_transaction(db, transaction_id)
    try:
        return transaction_service.update_transaction(db, transaction, data)
    except SQLAlchemyError as exc:
        raise _database_error(db, exc) from exc


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: DatabaseSession) -> Response:
    transaction = _require_transaction(db, transaction_id)
    try:
        transaction_service.delete_transaction(db, transaction)
    except SQLAlchemyError as exc:
        raise _database_error(db, exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)

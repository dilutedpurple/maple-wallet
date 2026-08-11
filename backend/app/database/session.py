from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


class DatabaseConfigurationError(RuntimeError):
    pass


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_database_url() -> str:
    database_url = get_settings().database_url.strip()
    if not database_url:
        raise DatabaseConfigurationError("DATABASE_URL is not configured")
    if not database_url.startswith("postgresql+psycopg://"):
        raise DatabaseConfigurationError("DATABASE_URL must use PostgreSQL with psycopg")
    return database_url


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(get_database_url(), pool_pre_ping=True)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(),
            autoflush=False,
            expire_on_commit=False,
        )
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    try:
        db = get_session_factory()()
    except DatabaseConfigurationError as exc:
        raise HTTPException(
            status_code=503,
            detail="데이터베이스가 설정되지 않았습니다.",
        ) from exc

    try:
        yield db
    finally:
        db.close()

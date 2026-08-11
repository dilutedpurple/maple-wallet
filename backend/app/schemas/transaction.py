from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    type: TransactionType
    category: str = Field(min_length=1, max_length=50)
    amount: int = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    transaction_date: date

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("category must not be empty")
        return normalized

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: TransactionType | None = None
    category: str | None = Field(default=None, min_length=1, max_length=50)
    amount: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=500)
    transaction_date: date | None = None

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("category must not be empty")
        return normalized

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @model_validator(mode="after")
    def reject_null_for_required_fields(self) -> Self:
        for field_name in ("type", "category", "amount", "transaction_date"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} cannot be null")
        return self


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

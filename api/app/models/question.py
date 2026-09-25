"""Questão de verdadeiro ou falso do banco de conteúdo."""

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Entity, enum_values
from app.models.category import Category


class QuestionStatus(str, enum.Enum):
    """Só questões `validated` chegam ao jogador."""

    DRAFT = "draft"
    VALIDATED = "validated"
    REJECTED = "rejected"


class QuestionOrigin(str, enum.Enum):
    HUMAN = "human"
    AI = "ai"


class Question(Entity):
    __tablename__ = "questions"

    statement: Mapped[str] = mapped_column(Text)
    is_true: Mapped[bool] = mapped_column(Boolean)
    explanation: Mapped[str] = mapped_column(Text)
    # Origem da informação usada na validação.
    source: Mapped[str] = mapped_column(String(500))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    status: Mapped[QuestionStatus] = mapped_column(
        Enum(QuestionStatus, native_enum=False, length=20, values_callable=enum_values),
        default=QuestionStatus.DRAFT,
        index=True,
    )
    origin: Mapped[QuestionOrigin] = mapped_column(
        Enum(QuestionOrigin, native_enum=False, length=20, values_callable=enum_values),
        default=QuestionOrigin.HUMAN,
    )
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    category: Mapped[Category] = relationship()

"""DTOs da curadoria de conteúdo e das ferramentas de IA."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.question import QuestionOrigin, QuestionStatus


class QuestionCreateRequest(BaseModel):
    statement: str = Field(min_length=5)
    is_true: bool
    explanation: str = Field(min_length=5)
    source: str = Field(min_length=2, max_length=500)
    category: str  # Slug da categoria


class QuestionReviewRequest(BaseModel):
    approve: bool


class QuestionAdminResponse(BaseModel):
    id: int
    statement: str
    is_true: bool
    explanation: str
    source: str
    category: str
    status: QuestionStatus
    origin: QuestionOrigin
    validated_at: datetime | None


class AIGenerateRequest(BaseModel):
    category: str  # Slug da categoria
    quantity: int = Field(default=3, ge=1, le=10)


class AIClassifyRequest(BaseModel):
    statement: str = Field(min_length=5)


class AIClassifyResponse(BaseModel):
    suggested_is_true: bool
    confidence: float
    rationale: str

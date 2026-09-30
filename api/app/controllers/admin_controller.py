"""Rotas de curadoria de conteúdo e ferramentas de IA (restritas a administradores)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.integrations.ai_client import AIClient, get_ai_client
from app.models.question import QuestionStatus
from app.schemas.admin_schema import (
    AIClassifyRequest,
    AIClassifyResponse,
    AIGenerateRequest,
    QuestionAdminResponse,
    QuestionCreateRequest,
    QuestionReviewRequest,
)
from app.services.ai_service import AIService
from app.services.content_service import ContentService

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


def get_content_service(db: Session = Depends(get_db)) -> ContentService:
    return ContentService(db)


def get_ai_service(
    db: Session = Depends(get_db), ai_client: AIClient = Depends(get_ai_client)
) -> AIService:
    return AIService(db, ai_client)


@router.get("/questions", response_model=list[QuestionAdminResponse])
def list_questions(
    status: QuestionStatus | None = None,
    service: ContentService = Depends(get_content_service),
) -> list[QuestionAdminResponse]:
    return service.list(status)


@router.post(
    "/questions", response_model=QuestionAdminResponse, status_code=status.HTTP_201_CREATED
)
def create_question(
    data: QuestionCreateRequest, service: ContentService = Depends(get_content_service)
) -> QuestionAdminResponse:
    return service.create(data)


@router.patch("/questions/{question_id}/review", response_model=QuestionAdminResponse)
def review_question(
    question_id: int,
    data: QuestionReviewRequest,
    service: ContentService = Depends(get_content_service),
) -> QuestionAdminResponse:
    return service.review(question_id, data)


@router.post(
    "/ai/generate",
    response_model=list[QuestionAdminResponse],
    status_code=status.HTTP_201_CREATED,
)
def generate_questions(
    data: AIGenerateRequest, service: AIService = Depends(get_ai_service)
) -> list[QuestionAdminResponse]:
    return service.generate(data)


@router.post("/ai/classify", response_model=AIClassifyResponse)
def classify_statement(
    data: AIClassifyRequest, service: AIService = Depends(get_ai_service)
) -> AIClassifyResponse:
    return service.classify(data)

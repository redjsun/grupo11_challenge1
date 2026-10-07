"""Configurações da aplicação (camada de infraestrutura).

Os valores podem ser sobrescritos por variáveis de ambiente (ver `.env.example`).
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Fake News Snake API"
    version: str = "0.1.0"
    cors_origins: list[str] = ["*"]
    database_url: str = "postgresql+psycopg://fako:fako@localhost:5432/fako"

    jwt_secret: str = "troque-este-segredo-em-producao"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24

    # Provedor usado por integrations/ai_client.py; "fake" roda sem chamadas externas.
    ai_provider: str = "fake"
    ai_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()

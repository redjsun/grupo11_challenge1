"""Camada de acesso a dados: isola as fontes de dados do restante do sistema."""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    def list(self) -> list[T]:
        ...

    @abstractmethod
    def get(self, entity_id: int) -> T | None:
        ...

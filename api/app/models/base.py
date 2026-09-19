"""Modelos de domínio compartilhados pelas demais camadas."""

from dataclasses import dataclass


@dataclass
class Entity:
    """Base para as entidades do domínio."""

    id: int

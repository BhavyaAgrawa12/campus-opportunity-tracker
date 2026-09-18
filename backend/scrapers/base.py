from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime

from app.models.enums import OpportunityCategory


@dataclass
class OpportunityDraft:
    title: str
    organization: str
    category: OpportunityCategory
    source: str
    application_url: str
    description: str | None = None
    domain: str | None = None
    location: str | None = None
    deadline: date | None = None
    event_date: date | None = None
    skills: list[str] = field(default_factory=list)
    is_paid: bool | None = None
    experience: str | None = None
    eligibility: str | None = None
    prize: str | None = None
    team_size: str | None = None
    mode: str | None = None
    source_url: str | None = None
    posted_at: datetime | None = None


class ScraperAdapter(ABC):
    source_name: str
    source_type: str

    @abstractmethod
    def fetch(self) -> list[dict]:
        raise NotImplementedError

    @abstractmethod
    def parse(self, raw_items: list[dict]) -> list[OpportunityDraft]:
        raise NotImplementedError

    def run(self) -> list[OpportunityDraft]:
        raw_items = self.fetch()
        return self.parse(raw_items)
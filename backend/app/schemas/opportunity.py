from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OpportunityCategory, OpportunityStatus


class OpportunityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    organization: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=20000)
    category: OpportunityCategory
    domain: str | None = Field(default=None, max_length=100)
    location: str | None = Field(default=None, max_length=120)
    deadline: date | None = None
    event_date: date | None = None
    skills: list[str] = Field(default_factory=list)
    is_paid: bool | None = None
    experience: str | None = Field(default=None, max_length=100)
    eligibility: str | None = None
    prize: str | None = None
    team_size: str | None = Field(default=None, max_length=50)
    mode: str | None = Field(default=None, max_length=50)
    source: str = Field(min_length=1, max_length=100)
    source_url: str | None = Field(default=None, max_length=500)
    application_url: str | None = Field(default=None, max_length=500)
    posted_at: datetime | None = None
    status: OpportunityStatus = OpportunityStatus.active


class OpportunityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    organization: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=20000)
    category: OpportunityCategory | None = None
    domain: str | None = Field(default=None, max_length=100)
    location: str | None = Field(default=None, max_length=120)
    deadline: date | None = None
    event_date: date | None = None
    skills: list[str] | None = None
    is_paid: bool | None = None
    experience: str | None = Field(default=None, max_length=100)
    eligibility: str | None = None
    prize: str | None = None
    team_size: str | None = Field(default=None, max_length=50)
    mode: str | None = Field(default=None, max_length=50)
    source: str | None = Field(default=None, min_length=1, max_length=100)
    source_url: str | None = Field(default=None, max_length=500)
    application_url: str | None = Field(default=None, max_length=500)
    posted_at: datetime | None = None
    status: OpportunityStatus | None = None


class OpportunityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    organization: str
    description: str | None
    category: OpportunityCategory
    domain: str | None
    location: str | None
    deadline: date | None
    event_date: date | None
    skills: list[str]
    is_paid: bool | None
    experience: str | None
    eligibility: str | None
    prize: str | None
    team_size: str | None
    mode: str | None
    source: str
    source_url: str | None
    application_url: str | None
    posted_at: datetime | None
    status: OpportunityStatus
    created_at: datetime
    updated_at: datetime


class OpportunityList(BaseModel):
    items: list[OpportunityRead]
    total: int
    page: int
    page_size: int

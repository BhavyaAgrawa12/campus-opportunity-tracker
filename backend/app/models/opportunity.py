from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum as SAEnum, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import OpportunityCategory, OpportunityStatus


class Opportunity(Base):
    __tablename__ = "opportunities"
    __table_args__ = (
        Index("ix_opportunities_category_status", "category", "status"),
        Index("ix_opportunities_deadline_status", "deadline", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), index=True)
    organization: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[OpportunityCategory] = mapped_column(
        SAEnum(
            OpportunityCategory,
            native_enum=False,
            values_callable=lambda e: [m.value for m in e],
            length=20,
        ),
        index=True,
    )
    domain: Mapped[str | None] = mapped_column(String(100), index=True)
    location: Mapped[str | None] = mapped_column(String(120), index=True)
    deadline: Mapped[date | None] = mapped_column(Date, index=True)
    event_date: Mapped[date | None] = mapped_column(Date)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_paid: Mapped[bool | None] = mapped_column(Boolean)
    experience: Mapped[str | None] = mapped_column(String(100))
    eligibility: Mapped[str | None] = mapped_column(Text)
    prize: Mapped[str | None] = mapped_column(Text)
    team_size: Mapped[str | None] = mapped_column(String(50))
    mode: Mapped[str | None] = mapped_column(String(50))
    source: Mapped[str] = mapped_column(String(100), index=True)
    source_url: Mapped[str | None] = mapped_column(String(500))
    application_url: Mapped[str] = mapped_column(String(500))
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[OpportunityStatus] = mapped_column(
        SAEnum(
            OpportunityStatus,
            native_enum=False,
            values_callable=lambda e: [m.value for m in e],
            length=20,
        ),
        default=OpportunityStatus.active,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    applications: Mapped[list[Application]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan"
    )
    saved_by: Mapped[list[SavedOpportunity]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan"
    )
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import SourceStatus, SourceType


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    url: Mapped[str | None] = mapped_column(String(500))
    type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType, native_enum=False, values_callable=lambda e: [m.value for m in e], length=20),
    )
    status: Mapped[SourceStatus] = mapped_column(
        SAEnum(
            SourceStatus,
            native_enum=False,
            values_callable=lambda e: [m.value for m in e],
            length=20,
        ),
        default=SourceStatus.active,
    )
    last_scraped: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scraping_logs: Mapped[list[ScrapingLog]] = relationship(
        back_populates="source", cascade="all, delete-orphan"
    )


class ScrapingLog(Base):
    __tablename__ = "scraping_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sources.id", ondelete="CASCADE"), index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    records_found: Mapped[int] = mapped_column(Integer, default=0)
    records_added: Mapped[int] = mapped_column(Integer, default=0)
    duplicates: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    error_detail: Mapped[str | None] = mapped_column(Text)

    source: Mapped[Source] = relationship(back_populates="scraping_logs")
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EmailAccount(Base):
    __tablename__ = "email_accounts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    email: Mapped[str] = mapped_column(String(255), index=True)
    provider: Mapped[str] = mapped_column(String(50), default="gmail")
    imap_server: Mapped[str] = mapped_column(String(200), default="imap.gmail.com")
    imap_port: Mapped[int] = mapped_column(Integer, default=993)
    username: Mapped[str] = mapped_column(String(255))
    password_encrypted: Mapped[str] = mapped_column(String(500))
    mailbox_folder: Mapped[str] = mapped_column(String(100), default="INBOX")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User | None] = relationship(back_populates="email_accounts")
    sender_allowlist: Mapped[list[SenderAllowlist]] = relationship(
        back_populates="email_account", cascade="all, delete-orphan"
    )


class SenderAllowlist(Base):
    __tablename__ = "sender_allowlist"
    __table_args__ = (
        UniqueConstraint(
            "email_account_id", "sender_email", name="uq_sender_allowlist_account_email"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email_account_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("email_accounts.id", ondelete="CASCADE"), index=True
    )
    sender_email: Mapped[str] = mapped_column(String(255), index=True)
    sender_name: Mapped[str | None] = mapped_column(String(200))
    category_hint: Mapped[str | None] = mapped_column(String(30))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    email_account: Mapped[EmailAccount | None] = relationship(
        back_populates="sender_allowlist"
    )
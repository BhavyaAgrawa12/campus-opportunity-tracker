from __future__ import annotations

import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select

from app.api.deps import CurrentUser, DbDep
from app.core.crypto import encrypt_secret
from app.models.email import EmailAccount, SenderAllowlist
from app.models.enums import OpportunityStatus, SourceStatus, SourceType, UserRole
from app.models.source import ScrapingLog, Source
from app.services.email_service import (
    fetch_emails_from_imap,
    ingest_raw_emails,
    sync_sample_placement_mailbox,
)
from scrapers.email_parser import EmailOpportunityParser

router = APIRouter()


class EmailAccountCreate(BaseModel):
    email: EmailStr
    provider: str = "gmail"
    imap_server: str = "imap.gmail.com"
    imap_port: int = 993
    username: str
    password: str = Field(..., description="Plain-text password or App Password; will be encrypted at rest.")
    mailbox_folder: str = "Nomination"


class EmailAccountRead(BaseModel):
    id: str
    email: str
    provider: str
    imap_server: str
    imap_port: int
    username: str
    mailbox_folder: str
    active: bool
    created_at: str


class SenderAllowlistCreate(BaseModel):
    email_account_id: str
    sender_email: str
    sender_name: Optional[str] = None
    category_hint: Optional[str] = None


class RawEmailIngestRequest(BaseModel):
    raw_content: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    sender: Optional[str] = "Placement Cell"


@router.get("/accounts", response_model=list[EmailAccountRead])
def list_email_accounts(db: DbDep, current_user: CurrentUser) -> list[EmailAccountRead]:
    """List designated email accounts connected to the user or system."""
    accounts = db.scalars(
        select(EmailAccount).where(
            (EmailAccount.user_id == current_user.id) | (EmailAccount.user_id.is_(None))
        )
    ).all()

    return [
        EmailAccountRead(
            id=str(a.id),
            email=a.email,
            provider=a.provider,
            imap_server=a.imap_server,
            imap_port=a.imap_port,
            username=a.username,
            mailbox_folder=a.mailbox_folder,
            active=a.active,
            created_at=a.created_at.isoformat() if a.created_at else "",
        )
        for a in accounts
    ]


@router.post("/accounts", response_model=EmailAccountRead, status_code=status.HTTP_201_CREATED)
def create_email_account(
    account_in: EmailAccountCreate,
    db: DbDep,
    current_user: CurrentUser,
) -> EmailAccountRead:
    """Register a designated mailbox account with credentials securely encrypted using Fernet."""
    encrypted_pw = encrypt_secret(account_in.password)

    new_account = EmailAccount(
        user_id=current_user.id,
        email=account_in.email,
        provider=account_in.provider,
        imap_server=account_in.imap_server,
        imap_port=account_in.imap_port,
        username=account_in.username,
        password_encrypted=encrypted_pw,
        mailbox_folder=account_in.mailbox_folder,
        active=True,
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return EmailAccountRead(
        id=str(new_account.id),
        email=new_account.email,
        provider=new_account.provider,
        imap_server=new_account.imap_server,
        imap_port=new_account.imap_port,
        username=new_account.username,
        mailbox_folder=new_account.mailbox_folder,
        active=new_account.active,
        created_at=new_account.created_at.isoformat() if new_account.created_at else "",
    )


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_email_account(
    account_id: str,
    db: DbDep,
    current_user: CurrentUser,
):
    """Remove a registered designated email account."""
    acc_uuid = uuid.UUID(account_id)
    account = db.scalar(
        select(EmailAccount).where(
            EmailAccount.id == acc_uuid,
            (EmailAccount.user_id == current_user.id) | (EmailAccount.user_id.is_(None)),
        )
    )
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")

    if account.user_id is None and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can remove system-wide mailboxes",
        )

    db.delete(account)
    db.commit()


@router.post("/accounts/{account_id}/sync")
def sync_email_account(
    account_id: str,
    db: DbDep,
    current_user: CurrentUser,
    limit: int = Query(default=15, ge=1, le=50),
) -> dict:
    """Connect to IMAP server via TLS, fetch recent messages from allowlisted senders, and parse opportunities."""
    acc_uuid = uuid.UUID(account_id)
    account = db.scalar(
        select(EmailAccount).where(
            EmailAccount.id == acc_uuid,
            (EmailAccount.user_id == current_user.id) | (EmailAccount.user_id.is_(None)),
        )
    )
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")

    try:
        raw_emails = fetch_emails_from_imap(account, limit=limit)
    except ConnectionError as err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"IMAP Connection Error: {str(err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch mailbox emails: {str(exc)}",
        )

    results = ingest_raw_emails(
        raw_emails=raw_emails,
        db=db,
        source_name=f"email_{account.email}",
        default_sender=account.email,
        tag_filter=account.mailbox_folder or "Nomination",
    )
    return {
        "status": "success",
        "message": f"Successfully synced mailbox for {account.email}",
        "data": results,
    }


@router.post("/sync-demo")
def sync_demo_placement_emails(db: DbDep, current_user: CurrentUser) -> dict:
    """Ingest sample Poornima placement drive, hackathon, and GSoC announcement emails into the live catalog."""
    results = sync_sample_placement_mailbox(db)
    return {
        "status": "success",
        "message": f"Campus placement sample emails ingested: {results['records_added']} new, {results['duplicates']} updated.",
        "data": results,
    }


@router.post("/ingest-raw")
def ingest_raw_email(
    payload: RawEmailIngestRequest,
    db: DbDep,
    current_user: CurrentUser,
) -> dict:
    """Directly ingest a raw RFC822 MIME message or structured subject/body from college emails."""
    if payload.raw_content:
        draft = EmailOpportunityParser.parse_raw_email(
            payload.raw_content, default_sender=payload.sender or "Placement Cell"
        )
    elif payload.subject and payload.body:
        draft = EmailOpportunityParser.parse_fields(
            subject=payload.subject,
            body_text=payload.body,
            sender=payload.sender or "Placement Cell",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either 'raw_content' (RFC822 MIME text) or both 'subject' and 'body'.",
        )

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to extract an opportunity from the provided email content.",
        )

    from pipeline.runner import ingest_drafts
    added, duplicates, errors = ingest_drafts([draft], db)
    db.commit()

    return {
        "status": "success",
        "action": "added" if added else "updated" if duplicates else "skipped",
        "draft": {
            "title": draft.title,
            "organization": draft.organization,
            "category": draft.category.value,
            "deadline": draft.deadline.isoformat() if draft.deadline else None,
            "application_url": draft.application_url,
            "location": draft.location,
            "skills": draft.skills,
        },
    }


@router.get("/allowlist")
def list_allowlist(db: DbDep) -> list[dict]:
    """Retrieve all approved opportunity senders (e.g. Poornima TPO, Unstop, HackerRank)."""
    senders = db.scalars(select(SenderAllowlist).where(SenderAllowlist.active.is_(True))).all()
    return [
        {
            "id": str(s.id),
            "sender_email": s.sender_email,
            "sender_name": s.sender_name,
            "category_hint": s.category_hint,
        }
        for s in senders
    ]


@router.post("/allowlist", status_code=status.HTTP_201_CREATED)
def add_allowlist_sender(
    payload: SenderAllowlistCreate,
    db: DbDep,
) -> dict:
    """Add a new sender to the designated mailbox allowlist."""
    acc_uuid = uuid.UUID(payload.email_account_id)
    new_entry = SenderAllowlist(
        email_account_id=acc_uuid,
        sender_email=payload.sender_email.lower().strip(),
        sender_name=payload.sender_name,
        category_hint=payload.category_hint,
        active=True,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return {
        "id": str(new_entry.id),
        "sender_email": new_entry.sender_email,
        "sender_name": new_entry.sender_name,
    }

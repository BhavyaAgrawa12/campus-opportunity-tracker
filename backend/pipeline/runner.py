from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Type

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from sqlalchemy import select, update

from app.core.database import SessionLocal
from app.models.enums import OpportunityStatus, SourceStatus, SourceType
from app.models.opportunity import Opportunity
from app.models.source import ScrapingLog, Source
from scrapers.base import OpportunityDraft, ScraperAdapter
from scrapers.company import CompanyCareerAdapter
from scrapers.devpost import DevpostAdapter
from scrapers.remotive import RemotiveAdapter
from scrapers.unstop import UnstopAdapter

logger = logging.getLogger(__name__)

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "ref", "ref_src", "fbclid", "gclid", "source", "tracking_code",
}


def normalize_url(raw_url: str) -> str:
    """Strip marketing tracking parameters and trailing slashes for canonical deduplication."""
    if not raw_url:
        return ""
    try:
        parsed = urlparse(raw_url.strip())
        filtered_q = [
            (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=False)
            if k.lower() not in TRACKING_PARAMS
        ]
        norm_path = parsed.path.rstrip("/")
        return urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            norm_path,
            parsed.params,
            urlencode(filtered_q),
            "",
        ))
    except Exception:
        return raw_url.strip()


def update_expired_opportunities(db) -> int:
    """Automatically mark opportunities with elapsed deadlines as expired."""
    today = date.today()
    stmt = (
        update(Opportunity)
        .where(Opportunity.deadline < today, Opportunity.status == OpportunityStatus.active)
        .values(status=OpportunityStatus.expired)
    )
    result = db.execute(stmt)
    db.commit()
    return result.rowcount or 0


# Registry of all available adapters
ADAPTER_REGISTRY: dict[str, tuple[Type[ScraperAdapter], SourceType, str]] = {
    "unstop": (UnstopAdapter, SourceType.hackathon, "https://unstop.com"),
    "devpost": (DevpostAdapter, SourceType.hackathon, "https://devpost.com"),
    "company_careers": (CompanyCareerAdapter, SourceType.company, "https://boards.greenhouse.io"),
    "remotive": (RemotiveAdapter, SourceType.job, "https://remotive.com"),
}


def ingest_drafts(drafts: list[OpportunityDraft], db) -> tuple[int, int, int]:
    """Process a list of OpportunityDrafts with canonical deduplication, returning (added, duplicates, errors)."""
    added = 0
    duplicates = 0
    errors = 0

    for draft in drafts:
        # Basic validation (FR-5.4)
        if not draft.title or not draft.organization or not draft.application_url:
            errors += 1
            continue

        clean_app_url = normalize_url(draft.application_url)
        clean_src_url = normalize_url(draft.source_url or draft.application_url)

        # Multi-attribute Deduplication (FR-5.3)
        # Check by canonical URL match OR exact (title, organization)
        existing = db.scalar(
            select(Opportunity).where(
                (Opportunity.application_url == clean_app_url)
                | (Opportunity.application_url == draft.application_url)
                | ((Opportunity.title == draft.title) & (Opportunity.organization == draft.organization))
            )
        )

        if existing:
            duplicates += 1
            # Update freshest fields
            existing.description = draft.description or existing.description
            existing.deadline = draft.deadline or existing.deadline
            existing.skills = draft.skills or existing.skills
            existing.prize = draft.prize or existing.prize
            if existing.deadline and existing.deadline < date.today():
                existing.status = OpportunityStatus.expired
            else:
                existing.status = OpportunityStatus.active
        else:
            is_expired = bool(draft.deadline and draft.deadline < date.today())
            new_opp = Opportunity(
                title=draft.title,
                organization=draft.organization,
                description=draft.description,
                category=draft.category,
                domain=draft.domain,
                location=draft.location,
                deadline=draft.deadline,
                event_date=draft.event_date,
                skills=draft.skills,
                is_paid=draft.is_paid,
                experience=draft.experience,
                eligibility=draft.eligibility,
                prize=draft.prize,
                team_size=draft.team_size,
                mode=draft.mode,
                source=draft.source,
                source_url=clean_src_url,
                application_url=clean_app_url,
                posted_at=draft.posted_at or datetime.now(timezone.utc),
                status=OpportunityStatus.expired if is_expired else OpportunityStatus.active,
            )
            db.add(new_opp)
            added += 1

    return added, duplicates, errors


def _run_pipeline_with_session(source_name: str, db) -> dict:
    adapter_cls, source_type, default_url = ADAPTER_REGISTRY[source_name]
    adapter = adapter_cls()

    # 1. Ensure Source record exists
    source = db.scalar(select(Source).where(Source.name == source_name))
    if not source:
        source = Source(
            name=source_name,
            url=default_url,
            type=source_type,
            status=SourceStatus.active,
        )
        db.add(source)
        db.commit()
        db.refresh(source)

    if source.status == SourceStatus.disabled:
        logger.info(f"Source {source_name} is disabled. Skipping.")
        return {"status": "skipped", "reason": "source disabled"}

    # 2. Initialize Scraping Log
    now = datetime.now(timezone.utc)
    log = ScrapingLog(
        source_id=source.id,
        started_at=now,
        records_found=0,
        records_added=0,
        duplicates=0,
        errors=0,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # 3. Run fetch & parse
    try:
        drafts = adapter.run()
    except Exception as exc:
        log.completed_at = datetime.now(timezone.utc)
        log.errors += 1
        log.error_detail = str(exc)
        db.commit()
        return {"status": "error", "error": str(exc)}

    log.records_found = len(drafts)
    added, duplicates, errors = ingest_drafts(drafts, db)

    # 4. Finalize log & source timestamp
    completed = datetime.now(timezone.utc)
    log.completed_at = completed
    log.records_added = added
    log.duplicates = duplicates
    log.errors = errors
    source.last_scraped = completed

    db.commit()

    result = {
        "source": source_name,
        "records_found": log.records_found,
        "records_added": added,
        "duplicates": duplicates,
        "errors": errors,
        "started_at": log.started_at.isoformat(),
        "completed_at": completed.isoformat(),
    }
    logger.info(f"Scraper run complete for {source_name}: {result}")
    return result


def run_adapter_pipeline(source_name: str, db=None) -> dict:
    """Executes a single adapter, performs deduplication, and records audit logs."""
    if source_name not in ADAPTER_REGISTRY:
        raise ValueError(f"Unknown scraper source: {source_name}")

    if db is not None:
        return _run_pipeline_with_session(source_name, db)
    with SessionLocal() as session:
        return _run_pipeline_with_session(source_name, session)


def run_all_scrapers(db=None) -> list[dict]:
    """Runs all active adapters sequentially."""
    results = []
    for source_name in ADAPTER_REGISTRY.keys():
        res = run_adapter_pipeline(source_name, db=db)
        results.append(res)
    return results

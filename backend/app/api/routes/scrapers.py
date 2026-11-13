from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import desc, select

from app.api.deps import DbDep
from app.core.scheduler import scraper_scheduler
from app.models.enums import SourceStatus, SourceType
from app.models.source import ScrapingLog, Source
from pipeline.runner import ADAPTER_REGISTRY, run_adapter_pipeline, run_all_scrapers

router = APIRouter()


@router.get("/status")
def get_scraper_status() -> dict:
    """Get real-time operational status, countdown timer until next 24-hr run, and active sources."""
    return scraper_scheduler.get_status()


@router.post("/refresh")
async def refresh_all_scrapers() -> dict:
    """Trigger an immediate scraping execution across all adapters and reset the 24-hr countdown."""
    if scraper_scheduler.is_running:
        return {
            "status": "in_progress",
            "message": "A scraping cycle is already currently running.",
            "data": scraper_scheduler.get_status(),
        }

    results = await scraper_scheduler.execute_scrape()
    total_found = sum(r.get("records_found", 0) for r in results)
    total_added = sum(r.get("records_added", 0) for r in results)
    total_duplicates = sum(r.get("duplicates", 0) for r in results)

    return {
        "status": "success",
        "message": f"Sync complete! Found {total_found} opportunities ({total_added} newly added, {total_duplicates} existing updated).",
        "summary": results,
        "scheduler": scraper_scheduler.get_status(),
    }


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    url: str | None
    type: SourceType
    status: SourceStatus
    last_scraped: str | None


class ScrapingLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_id: str
    source_name: str | None = None
    started_at: str
    completed_at: str | None
    records_found: int
    records_added: int
    duplicates: int
    errors: int
    error_detail: str | None


@router.get("", response_model=list[dict])
def list_sources(db: DbDep) -> list[dict]:
    """List all configured scraper sources and their operational status."""
    sources = db.scalars(select(Source).order_by(Source.name)).all()

    # If sources not in DB yet, seed from registry
    existing_names = {s.name for s in sources}
    new_added = False
    for name, (_, stype, url) in ADAPTER_REGISTRY.items():
        if name not in existing_names:
            new_src = Source(name=name, url=url, type=stype, status=SourceStatus.active)
            db.add(new_src)
            new_added = True
    if new_added:
        db.commit()
        sources = db.scalars(select(Source).order_by(Source.name)).all()

    return [
        {
            "id": str(s.id),
            "name": s.name,
            "url": s.url,
            "type": s.type.value,
            "status": s.status.value,
            "last_scraped": s.last_scraped.isoformat() if s.last_scraped else None,
        }
        for s in sources
    ]


@router.patch("/{source_name}/toggle")
def toggle_source(source_name: str, db: DbDep) -> dict:
    """Toggle a scraper source between active and disabled status (PRD FR-9.2)."""
    source = db.scalar(select(Source).where(Source.name == source_name))
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source '{source_name}' not found",
        )
    source.status = SourceStatus.disabled if source.status == SourceStatus.active else SourceStatus.active
    db.commit()
    db.refresh(source)
    return {
        "status": "success",
        "name": source.name,
        "source_status": source.status.value,
        "message": f"Source '{source.name}' is now {source.status.value}",
    }


@router.get("/logs", response_model=list[dict])
def list_scraping_logs(
    db: DbDep,
    limit: int = Query(default=20, ge=1, le=100),
) -> list[dict]:
    """Retrieve audit history of recent scraper runs."""
    logs = db.scalars(
        select(ScrapingLog)
        .order_by(desc(ScrapingLog.started_at))
        .limit(limit)
    ).all()

    result = []
    for log in logs:
        source_name = log.source.name if log.source else "unknown"
        result.append(
            {
                "id": str(log.id),
                "source_id": str(log.source_id),
                "source_name": source_name,
                "started_at": log.started_at.isoformat() if log.started_at else None,
                "completed_at": log.completed_at.isoformat() if log.completed_at else None,
                "records_found": log.records_found,
                "records_added": log.records_added,
                "duplicates": log.duplicates,
                "errors": log.errors,
                "error_detail": log.error_detail,
            }
        )
    return result


@router.post("/trigger/{source_name}")
def trigger_scraper(source_name: str, background_tasks: BackgroundTasks) -> dict:
    """Trigger an immediate scraping execution for a specified adapter."""
    if source_name not in ADAPTER_REGISTRY:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source '{source_name}' is not recognized. Available: {list(ADAPTER_REGISTRY.keys())}",
        )

    # Run in background task
    background_tasks.add_task(run_adapter_pipeline, source_name)
    return {
        "status": "triggered",
        "message": f"Scraping run scheduled for source '{source_name}'",
    }


@router.post("/trigger-all")
def trigger_all(background_tasks: BackgroundTasks) -> dict:
    """Trigger immediate execution for all active scraper adapters."""
    background_tasks.add_task(run_all_scrapers)
    return {
        "status": "triggered",
        "message": "Scraping run scheduled for all registered sources",
    }

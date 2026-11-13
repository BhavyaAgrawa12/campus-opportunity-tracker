from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
import logging
from typing import Any

from sqlalchemy import desc, select

from app.core.database import SessionLocal
from app.models.source import ScrapingLog, Source
from pipeline.runner import run_all_scrapers, update_expired_opportunities

logger = logging.getLogger(__name__)


class ScraperScheduler:
    """Manages 24-hour periodic automated scraping runs and on-demand refresh triggers."""

    INTERVAL_SECONDS = 86400  # Exactly 24 hours

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._is_running: bool = False
        self._last_scraped_at: datetime | None = None
        self._next_scrape_at: datetime = datetime.now(timezone.utc) + timedelta(seconds=self.INTERVAL_SECONDS)
        self._last_run_summary: list[dict[str, Any]] = []
        self._lock = asyncio.Lock()
        self._initialized = False

    def initialize_from_db(self) -> None:
        """Syncs scheduler timestamps with the latest database run log on system startup."""
        if self._initialized:
            return
        try:
            with SessionLocal() as db:
                latest_log = db.scalars(
                    select(ScrapingLog)
                    .where(ScrapingLog.completed_at.isnot(None))
                    .order_by(desc(ScrapingLog.completed_at))
                    .limit(1)
                ).first()

                now = datetime.now(timezone.utc)
                if latest_log and latest_log.completed_at:
                    completed = latest_log.completed_at
                    if completed.tzinfo is None:
                        completed = completed.replace(tzinfo=timezone.utc)
                    self._last_scraped_at = completed
                    # Calculate next scheduled run
                    scheduled_next = self._last_scraped_at + timedelta(seconds=self.INTERVAL_SECONDS)
                    if scheduled_next <= now:
                        # Overdue or due immediately: schedule in 15 seconds to allow full startup
                        self._next_scrape_at = now + timedelta(seconds=15)
                    else:
                        self._next_scrape_at = scheduled_next
                else:
                    # Fresh system with no prior logs: schedule initial run shortly
                    self._next_scrape_at = now + timedelta(seconds=15)
            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize scraper scheduler from database: {e}")
            self._next_scrape_at = datetime.now(timezone.utc) + timedelta(seconds=self.INTERVAL_SECONDS)
            self._initialized = True

    @property
    def is_running(self) -> bool:
        return self._is_running

    def get_status(self) -> dict[str, Any]:
        self.initialize_from_db()
        now = datetime.now(timezone.utc)
        seconds_remaining = max(0, int((self._next_scrape_at - now).total_seconds()))

        sources_info: list[dict[str, Any]] = []
        try:
            with SessionLocal() as db:
                sources = db.scalars(select(Source).order_by(Source.name)).all()
                for s in sources:
                    sources_info.append(
                        {
                            "name": s.name,
                            "type": s.type.value if hasattr(s.type, "value") else str(s.type),
                            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                            "last_scraped": s.last_scraped.isoformat() if s.last_scraped else None,
                        }
                    )
        except Exception:
            pass

        return {
            "is_running": self._is_running,
            "last_scraped_at": self._last_scraped_at.isoformat() if self._last_scraped_at else None,
            "next_scrape_at": self._next_scrape_at.isoformat(),
            "seconds_remaining": seconds_remaining,
            "interval_seconds": self.INTERVAL_SECONDS,
            "interval_hours": 24,
            "sources": sources_info,
            "last_run_summary": self._last_run_summary,
        }

    async def execute_scrape(self) -> list[dict[str, Any]]:
        """Executes all registered scrapers sequentially and updates scheduled cycle timestamps."""
        async with self._lock:
            if self._is_running:
                logger.warning("Scraper execution is already active. Rejecting concurrent call.")
                return self._last_run_summary

            self._is_running = True
            try:
                logger.info("Executing 24-hr scraper pipeline across all registered sources...")
                loop = asyncio.get_running_loop()
                results = await loop.run_in_executor(None, run_all_scrapers)

                # Auto-expire past deadline opportunities
                def _expire():
                    with SessionLocal() as db:
                        return update_expired_opportunities(db)

                expired_count = await loop.run_in_executor(None, _expire)
                logger.info(f"Marked {expired_count} expired opportunities during pipeline upkeep.")

                self._last_run_summary = results
                now = datetime.now(timezone.utc)
                self._last_scraped_at = now
                # Reset next scrape to exactly 24 hours from completion
                self._next_scrape_at = now + timedelta(seconds=self.INTERVAL_SECONDS)
                logger.info(f"Scrape completed successfully. Next automatic run scheduled at {self._next_scrape_at.isoformat()}")
                return results
            except Exception as e:
                logger.error(f"Error during scraper execution: {e}")
                # Fallback: re-schedule 1 hour later on error
                self._next_scrape_at = datetime.now(timezone.utc) + timedelta(hours=1)
                raise
            finally:
                self._is_running = False

    async def _loop(self) -> None:
        """Background coroutine that checks every 10 seconds for scheduled 24-hr execution."""
        self.initialize_from_db()
        while True:
            try:
                await asyncio.sleep(10)
                now = datetime.now(timezone.utc)
                if now >= self._next_scrape_at and not self._is_running:
                    logger.info("24-hour cycle timer elapsed. Triggering automatic scraper run.")
                    await self.execute_scrape()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scraper scheduler background loop: {e}")

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop())
            logger.info("24-Hour Scraper Scheduler background task active.")

    async def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("24-Hour Scraper Scheduler background task terminated.")


scraper_scheduler = ScraperScheduler()

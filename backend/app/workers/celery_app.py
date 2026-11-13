from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "cot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "scrape-all-sources-periodic": {
            "task": "app.workers.tasks.scrape_all_active_sources",
            "schedule": 86400.0,  # Run every 24 hours (86,400s)
        },
    },
)
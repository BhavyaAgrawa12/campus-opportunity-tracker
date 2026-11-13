from app.workers.celery_app import celery_app
from pipeline.runner import run_adapter_pipeline, run_all_scrapers


@celery_app.task(name="app.workers.tasks.ping")
def ping() -> str:
    return "pong"


@celery_app.task(name="app.workers.tasks.scrape_source")
def scrape_source(source_name: str) -> dict:
    return run_adapter_pipeline(source_name)


@celery_app.task(name="app.workers.tasks.scrape_all_active_sources")
def scrape_all_active_sources() -> list[dict]:
    return run_all_scrapers()
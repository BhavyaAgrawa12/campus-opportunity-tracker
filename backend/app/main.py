from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.scheduler import scraper_scheduler
from app import models  # noqa: F401


@asynccontextmanager
async def lifespan(_: FastAPI):
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
    # Start 24-hr background scraper scheduler
    await scraper_scheduler.start()
    yield
    # Gracefully stop scraper scheduler on shutdown
    await scraper_scheduler.stop()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
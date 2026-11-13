from fastapi import APIRouter

from app.api.routes import applications, auth, email, notifications, opportunities, saved, scrapers

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(saved.router, prefix="/saved", tags=["saved"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(scrapers.router, prefix="/scrapers", tags=["scrapers"])
api_router.include_router(email.router, prefix="/email", tags=["email"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

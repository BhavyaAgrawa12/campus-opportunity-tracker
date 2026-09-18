from fastapi import APIRouter

from app.api.routes import applications, auth, opportunities, saved

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(saved.router, prefix="/saved", tags=["saved"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])

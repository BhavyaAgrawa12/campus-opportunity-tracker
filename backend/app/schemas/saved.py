from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.opportunity import OpportunityRead


class SavedCreate(BaseModel):
    opportunity_id: UUID


class SavedRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    opportunity_id: UUID
    saved_at: datetime
    opportunity: OpportunityRead

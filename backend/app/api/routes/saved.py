from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbDep
from app.models.opportunity import Opportunity
from app.models.saved_opportunity import SavedOpportunity
from app.schemas.saved import SavedCreate, SavedRead

router = APIRouter()


@router.get("", response_model=list[SavedRead])
def list_saved(db: DbDep, user: CurrentUser) -> list[SavedOpportunity]:
    return list(
        db.scalars(
            select(SavedOpportunity)
            .options(selectinload(SavedOpportunity.opportunity))
            .where(SavedOpportunity.user_id == user.id)
            .order_by(SavedOpportunity.saved_at.desc())
        ).all()
    )


@router.post("", response_model=SavedRead, status_code=status.HTTP_201_CREATED)
def save_opportunity(payload: SavedCreate, db: DbDep, user: CurrentUser) -> SavedOpportunity:
    opp = db.get(Opportunity, payload.opportunity_id)
    if opp is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found"
        )
    existing = db.scalar(
        select(SavedOpportunity).where(
            SavedOpportunity.user_id == user.id,
            SavedOpportunity.opportunity_id == payload.opportunity_id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Opportunity already saved"
        )
    saved = SavedOpportunity(user_id=user.id, opportunity_id=payload.opportunity_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_opportunity(opportunity_id: UUID, db: DbDep, user: CurrentUser) -> None:
    saved = db.scalar(
        select(SavedOpportunity).where(
            SavedOpportunity.user_id == user.id,
            SavedOpportunity.opportunity_id == opportunity_id,
        )
    )
    if saved is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Saved opportunity not found"
        )
    db.delete(saved)
    db.commit()

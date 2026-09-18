from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import DbDep
from app.models.enums import (
    OpportunityCategory,
    OpportunityStatus,
    UserRole,
)
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.opportunity import OpportunityCreate, OpportunityList, OpportunityRead, OpportunityUpdate

router = APIRouter()


def _require_admin_or_coordinator(user: User) -> None:
    if user.role not in (UserRole.admin, UserRole.coordinator):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires admin or coordinator role",
        )


@router.get("", response_model=OpportunityList)
def list_opportunities(
    db: DbDep,
    category: OpportunityCategory | None = None,
    status_: OpportunityStatus = Query(default=OpportunityStatus.active, alias="status"),
    domain: str | None = None,
    location: str | None = None,
    q: str | None = Query(default=None, max_length=200),
    skills: list[str] | None = Query(default=None),
    is_paid: bool | None = None,
    deadline_before: date | None = None,
    deadline_after: date | None = None,
    sort_by: str = Query(default="posted_at", pattern="^(posted_at|deadline|title|created_at)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> OpportunityList:
    stmt = select(Opportunity).where(Opportunity.status == status_)

    if category is not None:
        stmt = stmt.where(Opportunity.category == category)
    if domain:
        stmt = stmt.where(Opportunity.domain.ilike(f"%{domain}%"))
    if location:
        stmt = stmt.where(Opportunity.location.ilike(f"%{location}%"))
    if is_paid is not None:
        stmt = stmt.where(Opportunity.is_paid == is_paid)
    if deadline_before is not None:
        stmt = stmt.where(Opportunity.deadline <= deadline_before)
    if deadline_after is not None:
        stmt = stmt.where(Opportunity.deadline >= deadline_after)
    if skills:
        for skill in skills:
            stmt = stmt.where(Opportunity.skills.contains([skill]))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Opportunity.title.ilike(like),
                Opportunity.organization.ilike(like),
                Opportunity.description.ilike(like),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    sort_cols = {
        "posted_at": Opportunity.posted_at,
        "deadline": Opportunity.deadline,
        "title": Opportunity.title,
        "created_at": Opportunity.created_at,
    }
    sort_col = sort_cols[sort_by]
    sort_col = sort_col.asc() if order == "asc" else sort_col.desc()

    items = db.scalars(
        stmt.order_by(sort_col, Opportunity.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return OpportunityList(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{opportunity_id}", response_model=OpportunityRead)
def get_opportunity(opportunity_id: UUID, db: DbDep) -> Opportunity:
    opp = db.scalar(
        select(Opportunity)
        .options(selectinload(Opportunity.applications))
        .where(Opportunity.id == opportunity_id)
    )
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    return opp


@router.post("", response_model=OpportunityRead, status_code=status.HTTP_201_CREATED)
def create_opportunity(payload: OpportunityCreate, db: DbDep) -> Opportunity:
    opp = Opportunity(**payload.model_dump())
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp


@router.patch("/{opportunity_id}", response_model=OpportunityRead)
def update_opportunity(
    opportunity_id: UUID, payload: OpportunityUpdate, db: DbDep
) -> Opportunity:
    opp = db.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(opp, key, value)
    db.commit()
    db.refresh(opp)
    return opp


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(opportunity_id: UUID, db: DbDep) -> None:
    opp = db.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    db.delete(opp)
    db.commit()

from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, cast, func, or_, select, String
from sqlalchemy.orm import Session, selectinload

from app.api.deps import CurrentUser, DbDep
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


@router.get("/metrics")
def get_opportunity_metrics(db: DbDep) -> dict:
    """Returns dynamic counts for opportunities categorized by type and status."""
    today = date.today()
    all_opps = db.scalars(
        select(Opportunity).where(Opportunity.status != OpportunityStatus.removed)
    ).all()

    total = len(all_opps)
    live_total = 0
    expired_total = 0
    by_category: dict[str, dict[str, int]] = {
        "hackathon": {"total": 0, "live": 0, "expired": 0},
        "internship": {"total": 0, "live": 0, "expired": 0},
        "job": {"total": 0, "live": 0, "expired": 0},
        "scholarship": {"total": 0, "live": 0, "expired": 0},
        "workshop": {"total": 0, "live": 0, "expired": 0},
    }

    for opp in all_opps:
        cat_key = opp.category.value if hasattr(opp.category, "value") else str(opp.category)
        if cat_key not in by_category:
            by_category[cat_key] = {"total": 0, "live": 0, "expired": 0}

        is_expired = (opp.status == OpportunityStatus.expired) or (
            opp.deadline is not None and opp.deadline < today
        )
        by_category[cat_key]["total"] += 1
        if is_expired:
            expired_total += 1
            by_category[cat_key]["expired"] += 1
        else:
            live_total += 1
            by_category[cat_key]["live"] += 1

    return {
        "total": total,
        "live_total": live_total,
        "expired_total": expired_total,
        "by_category": by_category,
    }


@router.get("", response_model=OpportunityList)
def list_opportunities(
    db: DbDep,
    category: OpportunityCategory | None = None,
    status_: OpportunityStatus | None = Query(default=None, alias="status"),
    status_filter: str = Query(default="live", pattern="^(live|expired|all)$"),
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
    today = date.today()
    stmt = select(Opportunity).where(Opportunity.status != OpportunityStatus.removed)

    # Expiry / Live status filtering
    if status_filter == "live":
        stmt = stmt.where(
            Opportunity.status == OpportunityStatus.active,
            or_(Opportunity.deadline.is_(None), Opportunity.deadline >= today),
        )
    elif status_filter == "expired":
        stmt = stmt.where(
            or_(
                Opportunity.status == OpportunityStatus.expired,
                and_(Opportunity.deadline.is_not(None), Opportunity.deadline < today),
            )
        )
    elif status_filter == "all" and status_ is not None:
        stmt = stmt.where(Opportunity.status == status_)

    if category is not None:
        stmt = stmt.where(Opportunity.category == category)
    if domain:
        d_lower = domain.lower()
        if d_lower in ("frontend", "web"):
            stmt = stmt.where(or_(Opportunity.domain.ilike("%Web%"), Opportunity.domain.ilike("%Frontend%")))
        elif d_lower in ("cloud", "devops"):
            stmt = stmt.where(or_(Opportunity.domain.ilike("%Cloud%"), Opportunity.domain.ilike("%DevOps%")))
        elif d_lower in ("ai", "ml", "ai/ml"):
            stmt = stmt.where(or_(Opportunity.domain.ilike("%AI%"), Opportunity.domain.ilike("%ML%")))
        else:
            stmt = stmt.where(Opportunity.domain.ilike(f"%{domain}%"))
    if location:
        if location.lower() == "remote":
            stmt = stmt.where(or_(Opportunity.location.ilike("%remote%"), Opportunity.mode.ilike("%remote%")))
        else:
            stmt = stmt.where(Opportunity.location.ilike(f"%{location}%"))
    if is_paid is not None:
        stmt = stmt.where(Opportunity.is_paid == is_paid)
    if deadline_before is not None:
        stmt = stmt.where(Opportunity.deadline <= deadline_before)
    if deadline_after is not None:
        stmt = stmt.where(Opportunity.deadline >= deadline_after)
    if skills:
        for skill in skills:
            stmt = stmt.where(cast(Opportunity.skills, String).ilike(f"%{skill}%"))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Opportunity.title.ilike(like),
                Opportunity.organization.ilike(like),
                Opportunity.description.ilike(like),
                Opportunity.domain.ilike(like),
                Opportunity.location.ilike(like),
                cast(Opportunity.skills, String).ilike(like),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    if sort_by == "deadline":
        sort_col = Opportunity.deadline.asc().nulls_last() if order == "asc" else Opportunity.deadline.desc().nulls_last()
    else:
        sort_cols = {
            "posted_at": Opportunity.posted_at,
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
def create_opportunity(
    payload: OpportunityCreate, db: DbDep, current_user: CurrentUser
) -> Opportunity:
    opp = Opportunity(**payload.model_dump())
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp


@router.patch("/{opportunity_id}", response_model=OpportunityRead)
def update_opportunity(
    opportunity_id: UUID,
    payload: OpportunityUpdate,
    db: DbDep,
    current_user: CurrentUser,
) -> Opportunity:
    _require_admin_or_coordinator(current_user)
    opp = db.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(opp, key, value)
    db.commit()
    db.refresh(opp)
    return opp


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: UUID, db: DbDep, current_user: CurrentUser
) -> None:
    _require_admin_or_coordinator(current_user)
    opp = db.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    db.delete(opp)
    db.commit()

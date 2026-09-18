from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbDep
from app.models.application import Application
from app.models.opportunity import Opportunity
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationRead

router = APIRouter()


@router.get("", response_model=list[ApplicationRead])
def list_applications(
    db: DbDep,
    current_user: CurrentUser,
) -> list[Application]:
    stmt = (
        select(Application)
        .options(selectinload(Application.opportunity))
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    return list(db.scalars(stmt).all())


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate, db: DbDep, current_user: CurrentUser
) -> Application:
    opp = db.get(Opportunity, payload.opportunity_id)
    if opp is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found"
        )

    existing = db.scalar(
        select(Application).where(
            Application.user_id == current_user.id,
            Application.opportunity_id == payload.opportunity_id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already applied to this opportunity"
        )

    app = Application(
        user_id=current_user.id,
        opportunity_id=payload.opportunity_id,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: UUID, payload: ApplicationUpdate, db: DbDep, current_user: CurrentUser
) -> Application:
    app = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(app, key, value)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: UUID, db: DbDep, current_user: CurrentUser
) -> None:
    app = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    db.delete(app)
    db.commit()

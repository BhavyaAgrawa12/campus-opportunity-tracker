from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.deps import CurrentUser, DbDep
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserRead, UserUpdate

router = APIRouter()



@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: DbDep) -> Token:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        domain=payload.domain,
        skills=payload.skills or [],
        location=payload.location,
        education=payload.education,
        preferred_role=payload.preferred_role,
        remote_preference=payload.remote_preference,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: DbDep) -> Token:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def me(current_user: CurrentUser) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate, current_user: CurrentUser, db: DbDep
) -> User:
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(current_user, field, val)
    db.commit()
    db.refresh(current_user)
    return current_user
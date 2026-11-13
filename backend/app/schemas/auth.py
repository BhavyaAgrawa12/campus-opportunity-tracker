from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.student
    domain: str | None = Field(default=None, max_length=100)
    skills: list[str] = Field(default_factory=list)
    location: str | None = Field(default=None, max_length=120)
    education: str | None = Field(default=None, max_length=200)
    preferred_role: str | None = Field(default=None, max_length=120)
    remote_preference: bool | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    domain: str | None = Field(default=None, max_length=100)
    skills: list[str] | None = None
    location: str | None = Field(default=None, max_length=120)
    education: str | None = Field(default=None, max_length=200)
    preferred_role: str | None = Field(default=None, max_length=120)
    remote_preference: bool | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    role: UserRole
    domain: str | None
    skills: list[str]
    location: str | None
    education: str | None
    preferred_role: str | None
    remote_preference: bool | None
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
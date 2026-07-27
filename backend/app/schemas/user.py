from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base schema that serializes fields as camelCase to match the
    TypeScript frontend, while still accepting snake_case on input."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class UserCreate(CamelModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(CamelModel):
    email: EmailStr
    password: str


class UserRead(CamelModel):
    id: int
    name: str
    email: EmailStr
    avatar_url: str | None
    role: str
    created_at: datetime


class AuthResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

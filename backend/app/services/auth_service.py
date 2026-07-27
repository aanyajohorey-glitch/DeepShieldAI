from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.models.user import User
from app.schemas.user import AuthResponse, UserCreate, UserLogin, UserRead


class AuthError(Exception):
    """Raised for auth failures the API layer should translate into 4xx responses."""


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def register_user(db: Session, payload: UserCreate) -> AuthResponse:
    if get_user_by_email(db, payload.email):
        raise AuthError("An account with this email already exists.")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return AuthResponse(access_token=token, user=UserRead.model_validate(user))


def authenticate_user(db: Session, payload: UserLogin) -> AuthResponse:
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise AuthError("Invalid email or password.")

    token = create_access_token(subject=str(user.id))
    return AuthResponse(access_token=token, user=UserRead.model_validate(user))

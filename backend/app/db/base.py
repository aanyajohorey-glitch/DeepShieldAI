from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models. Future phases add new
    model modules under app/db/models/ and import them in
    app/db/models/__init__.py so their tables register on this metadata."""

    pass

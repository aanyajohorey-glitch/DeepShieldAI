from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    prediction: Mapped[str] = mapped_column(String(16), nullable=False)  # REAL | DEEPFAKE
    confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)  # Low | Medium | High
    avg_frame_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    frames_processed: Mapped[int] = mapped_column(Integer, nullable=False)
    processing_time: Mapped[float] = mapped_column(Float, nullable=False)  # seconds
    model_used: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

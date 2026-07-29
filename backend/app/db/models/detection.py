from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
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
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    frames_processed: Mapped[int] = mapped_column(Integer, nullable=False)
    processing_time: Mapped[float] = mapped_column(Float, nullable=False)  # seconds
    model_used: Mapped[str] = mapped_column(String(255), nullable=False)

    # Explainable AI (Phase 4)
    frame_scores: Mapped[list[float]] = mapped_column(JSON, nullable=False, default=list)
    temporal_consistency: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    model_certainty: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    heuristics: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    heatmap_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Video metadata (Phase 4)
    video_width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    video_height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    video_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    video_fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    video_codec: Mapped[str | None] = mapped_column(String(16), nullable=True)
    video_frame_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

"""Orchestrates a detection request: validate → preprocess → predict →
persist. AI concerns (model loading, frame extraction, inference) live in
app.ai; this module owns the request-scoped workflow and database writes."""

import time
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai import prediction as prediction_module
from app.ai.errors import DetectionError
from app.ai.preprocessing import extract_frames, save_upload_streaming, validate_extension
from app.core.config import settings
from app.db.models.detection import Detection
from app.db.models.user import User

__all__ = ["DetectionError", "analyze_video", "get_history", "get_detection", "delete_detection"]


def analyze_video(db: Session, user: User, upload_file: UploadFile) -> Detection:
    extension = validate_extension(upload_file.filename)
    temp_path, _ = save_upload_streaming(upload_file, extension)

    started_at = time.perf_counter()
    try:
        frames = extract_frames(temp_path)
        outcome = prediction_module.predict(frames)
    finally:
        temp_path.unlink(missing_ok=True)

    processing_time = round(time.perf_counter() - started_at, 2)

    detection = Detection(
        user_id=user.id,
        filename=Path(upload_file.filename).name,
        prediction=outcome.prediction,
        confidence=outcome.confidence,
        risk_level=outcome.risk_level,
        avg_frame_score=outcome.avg_frame_score,
        explanation=outcome.explanation,
        frames_processed=len(frames),
        processing_time=processing_time,
        model_used=settings.detection_model_name,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    return detection


def get_history(db: Session, user: User, limit: int = 20, offset: int = 0) -> tuple[list[Detection], int]:
    base_query = select(Detection).where(Detection.user_id == user.id)

    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    items = db.scalars(
        base_query.order_by(Detection.created_at.desc()).offset(offset).limit(limit)
    ).all()

    return list(items), total


def get_detection(db: Session, user: User, detection_id: int) -> Detection | None:
    return db.scalar(
        select(Detection).where(Detection.id == detection_id, Detection.user_id == user.id)
    )


def delete_detection(db: Session, user: User, detection_id: int) -> bool:
    detection = get_detection(db, user, detection_id)
    if detection is None:
        return False
    db.delete(detection)
    db.commit()
    return True

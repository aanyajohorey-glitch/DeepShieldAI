"""Orchestrates a detection request: validate → preprocess → predict →
persist. AI concerns (model loading, frame extraction, inference) live in
app.ai; this module owns the request-scoped workflow and database writes."""

import logging
import time
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai import prediction_service
from app.ai.errors import DetectionError
from app.ai.preprocessing import extract_frames, extract_metadata, save_upload_streaming, validate_extension
from app.core.config import settings
from app.db.models.detection import Detection
from app.db.models.user import User

logger = logging.getLogger("deepshield.detection")

__all__ = ["DetectionError", "analyze_video", "get_history", "get_detection", "delete_detection"]


def analyze_video(db: Session, user: User, upload_file: UploadFile) -> Detection:
    extension = validate_extension(upload_file.filename)
    temp_path, file_size = save_upload_streaming(upload_file, extension)
    logger.info("Upload received: user=%s filename=%s size=%dB", user.id, upload_file.filename, file_size)

    started_at = time.perf_counter()
    try:
        video_metadata = extract_metadata(temp_path)
        frames = extract_frames(temp_path)
        outcome = prediction_service.predict(frames)
    except DetectionError as error:
        logger.warning("Analysis rejected: user=%s filename=%s reason=%s", user.id, upload_file.filename, error)
        raise
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
        frame_scores=outcome.frame_scores,
        temporal_consistency=outcome.temporal_consistency,
        model_certainty=outcome.model_certainty,
        heuristics=outcome.heuristics,
        heatmap_filename=outcome.heatmap_filename,
        video_width=video_metadata.width,
        video_height=video_metadata.height,
        video_duration_seconds=video_metadata.duration_seconds,
        video_fps=video_metadata.fps,
        video_codec=video_metadata.codec,
        video_frame_count=video_metadata.frame_count,
        file_size_bytes=file_size,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    logger.info(
        "Prediction complete: user=%s detection_id=%s verdict=%s confidence=%.1f%% frames=%d time=%.2fs",
        user.id,
        detection.id,
        detection.prediction,
        detection.confidence,
        detection.frames_processed,
        processing_time,
    )

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
    logger.info("Detection deleted: user=%s detection_id=%s", user.id, detection_id)
    return True

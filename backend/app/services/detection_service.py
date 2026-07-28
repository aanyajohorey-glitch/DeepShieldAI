import logging
import os
import time
import uuid
from pathlib import Path

import cv2
from fastapi import UploadFile
from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models.detection import Detection
from app.db.models.user import User
from app.services import ai_model

logger = logging.getLogger("deepshield.detection")


class DetectionError(Exception):
    """Raised for detection failures the API layer translates into HTTP responses."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code


def _ensure_upload_dir() -> Path:
    upload_dir = Path(settings.detection_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _validate_extension(filename: str | None) -> str:
    if not filename:
        raise DetectionError(400, "The uploaded file has no filename.")

    extension = Path(filename).suffix.lower()
    if extension not in settings.detection_allowed_extensions:
        allowed = ", ".join(settings.detection_allowed_extensions)
        raise DetectionError(
            400,
            f"Unsupported file format '{extension or 'unknown'}'. Supported formats: {allowed}.",
        )
    return extension


def _save_upload_streaming(upload_file: UploadFile, extension: str) -> tuple[Path, int]:
    """Stream the upload to a temp file, enforcing the max size limit while
    writing so oversized files never fully land on disk or in memory."""
    upload_dir = _ensure_upload_dir()
    max_bytes = settings.detection_max_upload_mb * 1024 * 1024
    temp_path = upload_dir / f"{uuid.uuid4().hex}{extension}"

    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB

    try:
        with open(temp_path, "wb") as destination:
            while True:
                chunk = upload_file.file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise DetectionError(
                        413,
                        f"File exceeds the maximum allowed size of {settings.detection_max_upload_mb}MB.",
                    )
                destination.write(chunk)
    except DetectionError:
        temp_path.unlink(missing_ok=True)
        raise
    except OSError as error:
        temp_path.unlink(missing_ok=True)
        raise DetectionError(500, "Failed to save the uploaded file.") from error

    if total_bytes == 0:
        temp_path.unlink(missing_ok=True)
        raise DetectionError(400, "The uploaded file is empty.")

    return temp_path, total_bytes


def _extract_frames(video_path: Path) -> list[Image.Image]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        raise DetectionError(422, "The uploaded file is not a valid or supported video.")

    try:
        fps = capture.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 25.0  # sensible fallback for videos with unreliable metadata

        frame_interval = max(1, round(fps * settings.detection_frame_sample_seconds))

        frames: list[Image.Image] = []
        frame_index = 0

        while len(frames) < settings.detection_max_frames:
            success, frame = capture.read()
            if not success:
                break

            if frame_index % frame_interval == 0:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(Image.fromarray(rgb_frame))

            frame_index += 1
    finally:
        capture.release()

    if not frames:
        raise DetectionError(422, "Could not extract any frames from the video. The file may be corrupted.")

    return frames


def _run_inference(frames: list[Image.Image]) -> list[float]:
    if not ai_model.is_model_ready():
        raise DetectionError(503, "The AI detection engine is still starting up. Please try again shortly.")

    pipeline = ai_model.get_pipeline()

    try:
        batched_results = pipeline(frames, batch_size=8, top_k=2)
    except Exception as error:  # pragma: no cover - defensive against model/runtime errors
        logger.exception("Inference failed")
        raise DetectionError(500, "AI inference failed while analyzing the video.") from error

    fake_scores: list[float] = []
    for frame_result in batched_results:
        score_by_label = {entry["label"]: entry["score"] for entry in frame_result}
        if "Fake" in score_by_label:
            fake_scores.append(float(score_by_label["Fake"]))
        elif "Real" in score_by_label:
            fake_scores.append(1.0 - float(score_by_label["Real"]))
        else:
            # Unexpected label set; fall back to the lowest-confidence class as "fake-leaning".
            fake_scores.append(1.0 - max(score_by_label.values()))

    return fake_scores


def _aggregate(fake_scores: list[float]) -> tuple[str, float, str, float]:
    avg_fake_score = sum(fake_scores) / len(fake_scores)

    prediction = "DEEPFAKE" if avg_fake_score >= settings.detection_fake_threshold else "REAL"
    confidence = (avg_fake_score if prediction == "DEEPFAKE" else 1.0 - avg_fake_score) * 100

    if avg_fake_score < 0.33:
        risk_level = "Low"
    elif avg_fake_score < 0.66:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return prediction, round(confidence, 1), risk_level, round(avg_fake_score * 100, 1)


def analyze_video(db: Session, user: User, upload_file: UploadFile) -> Detection:
    extension = _validate_extension(upload_file.filename)
    temp_path, _ = _save_upload_streaming(upload_file, extension)

    started_at = time.perf_counter()
    try:
        frames = _extract_frames(temp_path)
        fake_scores = _run_inference(frames)
    finally:
        temp_path.unlink(missing_ok=True)

    prediction, confidence, risk_level, avg_frame_score = _aggregate(fake_scores)
    processing_time = round(time.perf_counter() - started_at, 2)

    detection = Detection(
        user_id=user.id,
        filename=Path(upload_file.filename).name,
        prediction=prediction,
        confidence=confidence,
        risk_level=risk_level,
        avg_frame_score=avg_frame_score,
        frames_processed=len(fake_scores),
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

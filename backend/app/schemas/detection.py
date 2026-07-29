from datetime import datetime
from typing import TYPE_CHECKING, Literal

from app.schemas.user import CamelModel

if TYPE_CHECKING:
    from app.db.models.detection import Detection

Prediction = Literal["REAL", "DEEPFAKE"]
RiskLevel = Literal["Low", "Medium", "High"]


class VideoMetadata(CamelModel):
    width: int | None = None
    height: int | None = None
    duration_seconds: float | None = None
    fps: float | None = None
    frame_count: int | None = None
    codec: str | None = None
    file_size_bytes: int | None = None


class DetectionResult(CamelModel):
    id: int
    filename: str
    prediction: Prediction
    confidence: float
    risk_level: RiskLevel
    avg_frame_score: float
    explanation: str
    frames_processed: int
    processing_time: float
    model_used: str
    created_at: datetime

    # Explainable AI (Phase 4)
    frame_scores: list[float]
    temporal_consistency: float
    model_certainty: float
    heuristics: dict[str, float | int]
    heatmap_url: str | None = None

    # File / video metadata (Phase 4)
    metadata: VideoMetadata

    @classmethod
    def from_detection(cls, detection: "Detection") -> "DetectionResult":
        """Explicit ORM -> API mapping (rather than relying on implicit
        from_attributes matching) since the response nests video metadata
        and derives a public heatmap URL from the stored filename."""
        return cls(
            id=detection.id,
            filename=detection.filename,
            prediction=detection.prediction,
            confidence=detection.confidence,
            risk_level=detection.risk_level,
            avg_frame_score=detection.avg_frame_score,
            explanation=detection.explanation,
            frames_processed=detection.frames_processed,
            processing_time=detection.processing_time,
            model_used=detection.model_used,
            created_at=detection.created_at,
            frame_scores=detection.frame_scores or [],
            temporal_consistency=detection.temporal_consistency,
            model_certainty=detection.model_certainty,
            heuristics=detection.heuristics or {},
            heatmap_url=f"/static/heatmaps/{detection.heatmap_filename}" if detection.heatmap_filename else None,
            metadata=VideoMetadata(
                width=detection.video_width,
                height=detection.video_height,
                duration_seconds=detection.video_duration_seconds,
                fps=detection.video_fps,
                frame_count=detection.video_frame_count,
                codec=detection.video_codec,
                file_size_bytes=detection.file_size_bytes,
            ),
        )


class DetectionHistoryResponse(CamelModel):
    total: int
    items: list[DetectionResult]

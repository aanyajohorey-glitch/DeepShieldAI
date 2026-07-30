"""The single entry point the rest of the app calls into `app.ai` for:
orchestrates inference → aggregation → confidence stats → explainability
into one rich, structured outcome."""

import logging
from dataclasses import dataclass, field

from PIL import Image

from app.ai import confidence, explainability, inference, postprocessing, video_detector
from app.core.config import settings

logger = logging.getLogger("deepshield.prediction_service")


@dataclass
class PredictionOutcome:
    prediction: str  # "REAL" | "DEEPFAKE"
    confidence: float  # 0-100, confidence in the predicted class
    risk_level: str  # "Low" | "Medium" | "High"
    avg_frame_score: float  # 0-100, average fake-likelihood across frames
    explanation: str
    frame_scores: list[float] = field(default_factory=list)  # per-frame fake-likelihood, 0-100
    temporal_consistency: float = 100.0  # 0-100, agreement across frames
    model_certainty: float = 0.0  # 0-100, distance from the decision threshold
    heuristics: dict[str, float | int] = field(default_factory=dict)
    heatmap_filename: str | None = None  # attention-rollout visualization, if enabled


def predict(frames: list[Image.Image], media_type: str = "video") -> PredictionOutcome:
    fake_scores = inference.run_inference(frames)
    prediction, avg_fake_score = postprocessing.aggregate(fake_scores)

    conf = confidence.confidence_percent(avg_fake_score, prediction)
    risk_level = confidence.risk_level_for(avg_fake_score)
    avg_frame_score = round(avg_fake_score * 100, 1)
    temporal = confidence.temporal_consistency(fake_scores)
    certainty = confidence.model_certainty(avg_fake_score)
    frame_scores_pct = confidence.frame_scores_percent(fake_scores)

    heuristics_data = explainability.compute_heuristics(frames)

    heatmap_filename = None
    if settings.detection_enable_heatmap:
        most_suspicious_index = max(range(len(fake_scores)), key=lambda i: fake_scores[i])
        heatmap_image = explainability.generate_attention_heatmap(frames[most_suspicious_index])
        if heatmap_image is not None:
            heatmap_filename = explainability.save_heatmap(heatmap_image)

    explanation = explainability.build_explanation(
        prediction=prediction,
        confidence=conf,
        risk_level=risk_level,
        frames_processed=len(fake_scores),
        avg_frame_score=avg_frame_score,
        temporal_consistency=temporal,
        model_certainty=certainty,
        heuristics=heuristics_data,
        media_type=media_type,
    )

    return PredictionOutcome(
        prediction=prediction,
        confidence=conf,
        risk_level=risk_level,
        avg_frame_score=avg_frame_score,
        explanation=explanation,
        frame_scores=frame_scores_pct,
        temporal_consistency=temporal,
        model_certainty=certainty,
        heuristics=heuristics_data,
        heatmap_filename=heatmap_filename,
    )


def predict_video(frames: list[Image.Image]) -> PredictionOutcome:
    """Video-specific counterpart to predict() — uses F3-Net (face-cropped
    frequency-domain CNN) instead of the image model, since a single ViT
    image classifier applied per-frame doesn't use any temporal/video-native
    signal. Reuses the same confidence/risk-level/heuristics machinery
    (model-agnostic), but with F3-Net's own decision threshold and no
    attention heatmap — F3-Net has no transformer attention to roll out, and
    fabricating a visualization technique it doesn't actually support would
    violate this project's own rule against inventing signals a model
    doesn't produce."""
    fake_scores = video_detector.run_inference(frames)
    prediction, avg_fake_score = video_detector.aggregate(fake_scores)

    conf = confidence.confidence_percent(avg_fake_score, prediction)
    risk_level = confidence.risk_level_for(avg_fake_score)
    avg_frame_score = round(avg_fake_score * 100, 1)
    temporal = confidence.temporal_consistency(fake_scores)
    certainty = confidence.model_certainty(avg_fake_score, threshold=settings.video_fake_threshold)
    frame_scores_pct = confidence.frame_scores_percent(fake_scores)

    heuristics_data = explainability.compute_heuristics(frames)

    explanation = explainability.build_explanation(
        prediction=prediction,
        confidence=conf,
        risk_level=risk_level,
        frames_processed=len(fake_scores),
        avg_frame_score=avg_frame_score,
        temporal_consistency=temporal,
        model_certainty=certainty,
        heuristics=heuristics_data,
        media_type="video",
    )

    return PredictionOutcome(
        prediction=prediction,
        confidence=conf,
        risk_level=risk_level,
        avg_frame_score=avg_frame_score,
        explanation=explanation,
        frame_scores=frame_scores_pct,
        temporal_consistency=temporal,
        model_certainty=certainty,
        heuristics=heuristics_data,
        heatmap_filename=None,
    )

"""Runs frames through the loaded model and turns raw scores into the
verdict, confidence, risk level, and a human-readable explanation."""

import logging
from dataclasses import dataclass

from PIL import Image

from app.ai import model_loader
from app.ai.errors import DetectionError
from app.core.config import settings

logger = logging.getLogger("deepshield.prediction")


@dataclass
class PredictionOutcome:
    prediction: str  # "REAL" | "DEEPFAKE"
    confidence: float  # 0-100, confidence in the predicted class
    risk_level: str  # "Low" | "Medium" | "High"
    avg_frame_score: float  # 0-100, average fake-likelihood across frames
    explanation: str


def _run_inference(frames: list[Image.Image]) -> list[float]:
    if not model_loader.is_model_ready():
        raise DetectionError(503, "The AI detection engine is still starting up. Please try again shortly.")

    pipeline = model_loader.get_pipeline()

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


def _risk_level_for(avg_fake_score: float) -> str:
    if avg_fake_score < 0.33:
        return "Low"
    if avg_fake_score < 0.66:
        return "Medium"
    return "High"


def _explain(prediction: str, confidence: float, risk_level: str, frames_processed: int, avg_frame_score: float) -> str:
    frame_word = "frame" if frames_processed == 1 else "frames"
    verdict_phrase = (
        "did not show strong signs of AI manipulation"
        if prediction == "REAL"
        else "showed signs consistent with AI-generated or manipulated content"
    )
    risk_phrase = {
        "Low": "minimal fake-signal was detected across the sampled frames.",
        "Medium": "some frames showed moderate fake-signal — a manual review is recommended.",
        "High": "a majority of sampled frames showed strong fake-signal.",
    }[risk_level]

    return (
        f"Analyzed {frames_processed} sampled {frame_word}. The average fake-likelihood "
        f"across those frames was {avg_frame_score:.1f}%, producing a {prediction} verdict "
        f"with {confidence:.1f}% confidence. The video {verdict_phrase}. "
        f"Risk level: {risk_level} — {risk_phrase}"
    )


def predict(frames: list[Image.Image]) -> PredictionOutcome:
    fake_scores = _run_inference(frames)
    avg_fake_score = sum(fake_scores) / len(fake_scores)

    prediction = "DEEPFAKE" if avg_fake_score >= settings.detection_fake_threshold else "REAL"
    confidence = round((avg_fake_score if prediction == "DEEPFAKE" else 1.0 - avg_fake_score) * 100, 1)
    risk_level = _risk_level_for(avg_fake_score)
    avg_frame_score = round(avg_fake_score * 100, 1)

    explanation = _explain(prediction, confidence, risk_level, len(fake_scores), avg_frame_score)

    return PredictionOutcome(
        prediction=prediction,
        confidence=confidence,
        risk_level=risk_level,
        avg_frame_score=avg_frame_score,
        explanation=explanation,
    )

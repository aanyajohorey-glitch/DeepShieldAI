"""Statistics derived from the model's actual per-frame outputs — confidence,
risk level, temporal consistency, and certainty. Everything here is computed
directly from real scores the model produced; nothing is invented."""

import statistics

from app.core.config import settings


def confidence_percent(avg_fake_score: float, prediction: str) -> float:
    """Confidence (0-100) in the predicted class."""
    raw = avg_fake_score if prediction == "DEEPFAKE" else 1.0 - avg_fake_score
    return round(raw * 100, 1)


def risk_level_for(avg_fake_score: float) -> str:
    if avg_fake_score < 0.33:
        return "Low"
    if avg_fake_score < 0.66:
        return "Medium"
    return "High"


def temporal_consistency(fake_scores: list[float]) -> float:
    """0-100: how much the sampled frames agreed with each other. 100 means
    every frame produced (almost) the same score; a lower number means the
    model's assessment varied significantly across the video, which is
    itself a useful signal (e.g. a deepfake that's only convincing in part
    of the clip, or a borderline/ambiguous video)."""
    if len(fake_scores) < 2:
        return 100.0

    spread = statistics.pstdev(fake_scores)
    # Population stdev of values in [0, 1] maxes out at 0.5 (half at 0, half
    # at 1) — normalize against that so the result is a clean 0-100 scale.
    consistency = max(0.0, 1 - (spread / 0.5))
    return round(consistency * 100, 1)


def model_certainty(avg_fake_score: float, threshold: float | None = None) -> float:
    """0-100: how far the average score sits from the decision threshold.
    A score right at the threshold (maximally ambiguous) scores 0; a score
    at the extreme end of the scale (0% or 100% fake-likelihood) scores 100.
    This is a distinct signal from `confidence_percent` — a video can have
    high confidence in its predicted class while still sitting close to the
    threshold in absolute terms, and vice versa for small sample counts.

    `threshold` defaults to the image model's decision threshold — pass
    `settings.video_fake_threshold` explicitly when scoring the video
    (F3-Net) pipeline, since the two models were calibrated independently."""
    threshold = threshold if threshold is not None else settings.detection_fake_threshold
    distance = abs(avg_fake_score - threshold)
    max_distance = max(threshold, 1 - threshold)
    if max_distance <= 0:
        return 100.0
    return round(min(1.0, distance / max_distance) * 100, 1)


def frame_scores_percent(fake_scores: list[float]) -> list[float]:
    """Per-frame fake-likelihood, 0-100, for charting."""
    return [round(score * 100, 1) for score in fake_scores]

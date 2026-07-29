"""Turns raw per-frame fake-likelihood scores into an overall verdict."""

from app.core.config import settings


def aggregate(fake_scores: list[float]) -> tuple[str, float]:
    """Returns (prediction, avg_fake_score) where avg_fake_score is in [0, 1]."""
    avg_fake_score = sum(fake_scores) / len(fake_scores)
    prediction = "DEEPFAKE" if avg_fake_score >= settings.detection_fake_threshold else "REAL"
    return prediction, avg_fake_score

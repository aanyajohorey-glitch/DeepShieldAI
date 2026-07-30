"""Still-image deepfake detection — the dedicated entry point for image
uploads (jpg/jpeg/png/webp). Uses the existing dima806 ViT classifier via
the shared prediction_service pipeline (inference, aggregation, confidence,
heuristics, attention heatmap all already work correctly on a single-image
list — nothing about that pipeline is video-specific). This module exists
so image handling has its own clear entry point per the dual-detector
routing, and so video frames are never accidentally run through here or
vice versa."""

from PIL import Image

from app.ai import prediction_service


def analyze_image(image: Image.Image) -> prediction_service.PredictionOutcome:
    return prediction_service.predict([image], media_type="image")

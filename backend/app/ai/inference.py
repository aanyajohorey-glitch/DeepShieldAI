"""Raw model inference: frames in, per-frame fake-likelihood scores out.
No aggregation or interpretation happens here — see postprocessing.py and
confidence.py for that."""

import logging

from PIL import Image

from app.ai import model_loader
from app.ai.errors import DetectionError

logger = logging.getLogger("deepshield.inference")


def run_inference(frames: list[Image.Image]) -> list[float]:
    """Returns one fake-likelihood score per frame, in [0, 1]."""
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

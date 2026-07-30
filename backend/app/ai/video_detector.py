"""Video deepfake detection via F3-Net — a frequency-domain CNN detector
from DeepfakeBench, distinct from the image pipeline (image_detector.py /
dima806 ViT), which only ever processes single still images. Frames without
a detectable face are skipped rather than fed to the model blind, since
F3-Net's signal is meaningless on a non-face crop."""

import logging

import numpy as np
import torch
from PIL import Image

from app.ai import model_loader
from app.ai.errors import DetectionError
from app.core.config import settings

logger = logging.getLogger("deepshield.video_detector")


def _normalize(face: Image.Image) -> torch.Tensor:
    """F3-Net's expected input: RGB, resolution x resolution, normalized to
    mean=0.5/std=0.5 per channel (i.e. pixel values mapped to [-1, 1])."""
    array = np.asarray(face, dtype=np.float32) / 255.0
    array = (array - 0.5) / 0.5
    return torch.from_numpy(array).permute(2, 0, 1)  # (3, H, W)


def run_inference(frames: list[Image.Image]) -> list[float]:
    """Returns one fake-likelihood score per frame that had a detectable
    face, in [0, 1]. Frames with no detected face are silently skipped —
    they carry no usable signal for a face-forgery model."""
    if not model_loader.is_video_model_ready():
        raise DetectionError(503, "The video AI detection engine is still starting up. Please try again shortly.")

    model = model_loader.get_video_model()
    face_detector = model_loader.get_face_detector()
    device = model_loader.video_device()

    crops: list[torch.Tensor] = []
    for frame in frames:
        crop = face_detector.crop_face(frame)
        if crop is None:
            continue
        crops.append(_normalize(crop))

    if not crops:
        raise DetectionError(
            422, "No face could be detected in this video. Analysis requires at least one visible face."
        )

    batch = torch.stack(crops).to(device)

    try:
        with torch.no_grad():
            probs = model(batch)
    except Exception as error:  # pragma: no cover - defensive against model/runtime errors
        logger.exception("F3-Net inference failed")
        raise DetectionError(500, "AI inference failed while analyzing the video.") from error

    return [float(p) for p in probs.cpu()]


def aggregate(fake_scores: list[float]) -> tuple[str, float]:
    """Same shape as postprocessing.aggregate(), but against F3-Net's own
    threshold (video_fake_threshold) rather than the image model's."""
    avg_fake_score = sum(fake_scores) / len(fake_scores)
    prediction = "DEEPFAKE" if avg_fake_score >= settings.video_fake_threshold else "REAL"
    return prediction, avg_fake_score

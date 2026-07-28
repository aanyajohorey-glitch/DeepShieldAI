"""Singleton loader for the pretrained deepfake detection model.

The model is loaded once during application startup (see app.main's lifespan)
so per-request inference never pays model/download initialization cost.
"""

import logging

import torch
from transformers import pipeline as hf_pipeline
from transformers.pipelines.base import Pipeline

from app.core.config import settings

logger = logging.getLogger("deepshield.ai_model")

_pipeline: Pipeline | None = None
_device_label: str = "CPU"


def load_model() -> None:
    global _pipeline, _device_label

    if _pipeline is not None:
        return

    device = 0 if torch.cuda.is_available() else -1
    _device_label = "GPU" if device == 0 else "CPU"

    logger.info(
        "Loading deepfake detection model '%s' on %s...",
        settings.detection_model_name,
        _device_label,
    )
    _pipeline = hf_pipeline(
        "image-classification",
        model=settings.detection_model_name,
        device=device,
    )
    logger.info("Deepfake detection model loaded and ready.")


def get_pipeline() -> Pipeline:
    if _pipeline is None:
        raise RuntimeError(
            "Detection model is not loaded. It should be initialized during app startup."
        )
    return _pipeline


def is_model_ready() -> bool:
    return _pipeline is not None


def device_label() -> str:
    return _device_label

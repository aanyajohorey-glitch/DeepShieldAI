"""Model management for the pretrained deepfake detection model.

`ModelManager` owns the lifecycle of the active model: loading it once,
validating its output contract, and (for future phases) switching to a
different Hugging Face model without restarting the app. The module-level
functions below are a thin, stable façade over a singleton `ModelManager` —
existing call sites (`load_model()`, `get_pipeline()`, etc.) are unchanged
from earlier phases; new capabilities are additive.
"""

import logging
import time
from dataclasses import dataclass, field

import torch
from transformers import pipeline as hf_pipeline
from transformers.image_processing_utils import BaseImageProcessor
from transformers.modeling_utils import PreTrainedModel
from transformers.pipelines.base import Pipeline

from app.core.config import settings

logger = logging.getLogger("deepshield.ai_model")


@dataclass
class ModelInfo:
    name: str
    device: str
    labels: list[str] = field(default_factory=list)
    loaded_at: float | None = None
    load_duration_seconds: float | None = None


class ModelManager:
    """Loads, validates, and (in future) swaps the active detection model."""

    def __init__(self) -> None:
        self._pipeline: Pipeline | None = None
        self._info: ModelInfo | None = None

    def load(self, model_name: str | None = None) -> None:
        target = model_name or settings.detection_model_name

        if self._pipeline is not None and self._info is not None and self._info.name == target:
            return  # already loaded — startup can call this safely more than once

        device = 0 if torch.cuda.is_available() else -1
        device_label = "GPU" if device == 0 else "CPU"

        logger.info("Loading deepfake detection model '%s' on %s...", target, device_label)
        started = time.perf_counter()

        pipeline = hf_pipeline("image-classification", model=target, device=device)
        labels = self._validate(pipeline)

        duration = round(time.perf_counter() - started, 2)
        self._pipeline = pipeline
        self._info = ModelInfo(
            name=target,
            device=device_label,
            labels=labels,
            loaded_at=time.time(),
            load_duration_seconds=duration,
        )
        logger.info("Model '%s' loaded on %s in %.2fs.", target, device_label, duration)

    def _validate(self, pipeline: Pipeline) -> list[str]:
        """Sanity-check that the model exposes the binary Real/Fake
        classification contract the rest of the app assumes, and surface a
        clear warning (rather than a silent misclassification) if not."""
        id2label = getattr(pipeline.model.config, "id2label", {})
        labels = list(id2label.values())
        lower_labels = {label.lower() for label in labels}

        if not {"real", "fake"} <= lower_labels:
            logger.warning(
                "Model '%s' labels %s do not include the expected 'Real'/'Fake' pair — "
                "inference will fall back to a lowest-confidence-class heuristic.",
                pipeline.model.name_or_path,
                labels,
            )

        return labels

    def switch_model(self, model_name: str) -> None:
        """Load a different Hugging Face model id, replacing the active one.
        Supports future phases that offer multiple or fine-tuned models."""
        logger.info("Switching detection model to '%s'...", model_name)
        previous = self._info.name if self._info else None
        self._pipeline = None
        self._info = None
        try:
            self.load(model_name)
        except Exception:
            logger.exception("Failed to switch to model '%s'; reverting to '%s'.", model_name, previous)
            if previous:
                self.load(previous)
            raise

    def is_ready(self) -> bool:
        return self._pipeline is not None

    def pipeline(self) -> Pipeline:
        if self._pipeline is None:
            raise RuntimeError(
                "Detection model is not loaded. It should be initialized during app startup."
            )
        return self._pipeline

    def model(self) -> PreTrainedModel:
        return self.pipeline().model

    def image_processor(self) -> BaseImageProcessor:
        return self.pipeline().image_processor

    def device_label(self) -> str:
        return self._info.device if self._info else "CPU"

    def info(self) -> ModelInfo | None:
        return self._info


_manager = ModelManager()


def load_model() -> None:
    _manager.load()


def get_pipeline() -> Pipeline:
    return _manager.pipeline()


def get_model() -> PreTrainedModel:
    return _manager.model()


def get_image_processor() -> BaseImageProcessor:
    return _manager.image_processor()


def is_model_ready() -> bool:
    return _manager.is_ready()


def device_label() -> str:
    return _manager.device_label()


def model_info() -> ModelInfo | None:
    return _manager.info()


def switch_model(model_name: str) -> None:
    _manager.switch_model(model_name)

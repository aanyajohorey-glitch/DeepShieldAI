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

from app.ai.face_detection import FaceDetector
from app.ai.models.f3net import F3NetModel
from app.ai.models.weights import ensure_f3net_weights
from app.core.config import settings

logger = logging.getLogger("deepshield.model_loader")


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


@dataclass
class VideoModelInfo:
    name: str = "F3-Net"
    device: str = "CPU"
    loaded_at: float | None = None
    load_duration_seconds: float | None = None
    checkpoint_path: str | None = None


class VideoModelManager:
    """Loads F3-Net (video deepfake detector) and its MTCNN face-cropper
    once, mirroring `ModelManager`'s pattern for the image model. Kept as a
    separate manager rather than folded into `ModelManager` since the two
    models have unrelated loading mechanics (Hugging Face pipeline vs. a
    vendored checkpoint + face detector)."""

    def __init__(self) -> None:
        self._model: F3NetModel | None = None
        self._face_detector: FaceDetector | None = None
        self._info: VideoModelInfo | None = None
        self._device: str = "cpu"

    def load(self) -> None:
        if self._model is not None:
            return  # already loaded — startup can call this safely more than once

        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        device_label = "GPU" if self._device == "cuda" else "CPU"

        logger.info("Loading video detection model 'F3-Net' on %s...", device_label)
        started = time.perf_counter()

        checkpoint_path = ensure_f3net_weights(settings.video_model_weights_dir)
        model = F3NetModel(resolution=settings.video_model_resolution)
        state_dict = torch.load(checkpoint_path, map_location="cpu")
        model.load_state_dict(state_dict)
        model.eval()
        model.to(self._device)

        self._model = model
        self._face_detector = FaceDetector(device=self._device)

        duration = round(time.perf_counter() - started, 2)
        self._info = VideoModelInfo(
            device=device_label,
            loaded_at=time.time(),
            load_duration_seconds=duration,
            checkpoint_path=str(checkpoint_path),
        )
        logger.info("Video model 'F3-Net' loaded on %s in %.2fs.", device_label, duration)

    def is_ready(self) -> bool:
        return self._model is not None

    def model(self) -> F3NetModel:
        if self._model is None:
            raise RuntimeError(
                "Video detection model is not loaded. It should be initialized during app startup."
            )
        return self._model

    def face_detector(self) -> FaceDetector:
        if self._face_detector is None:
            raise RuntimeError(
                "Face detector is not loaded. It should be initialized during app startup."
            )
        return self._face_detector

    def device(self) -> str:
        return self._device

    def info(self) -> VideoModelInfo | None:
        return self._info


_manager = ModelManager()
_video_manager = VideoModelManager()


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


def load_video_model() -> None:
    _video_manager.load()


def is_video_model_ready() -> bool:
    return _video_manager.is_ready()


def get_video_model() -> F3NetModel:
    return _video_manager.model()


def get_face_detector() -> FaceDetector:
    return _video_manager.face_detector()


def video_device_label() -> str:
    return _video_manager.info().device if _video_manager.info() else "CPU"


def video_device() -> str:
    """The torch device string ("cuda"/"cpu") the video model is loaded on
    — distinct from video_device_label()'s human-readable "GPU"/"CPU"."""
    return _video_manager.device()


def video_model_info() -> VideoModelInfo | None:
    return _video_manager.info()

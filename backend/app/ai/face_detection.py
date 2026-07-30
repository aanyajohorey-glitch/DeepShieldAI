"""Face detection and cropping for the video pipeline, using MTCNN
(facenet-pytorch) instead of DeepfakeBench's original dlib-based
preprocessing — dlib requires compiling from source on this platform
(no prebuilt wheel for this Python version), while MTCNN is a pure
PyTorch model with no build step. Verified against real face images to
produce sane bounding boxes before being wired into the video pipeline.
"""

import logging
import os

from PIL import Image

logger = logging.getLogger("deepshield.face_detection")

# Test-only escape hatch (never read outside this module, not a documented
# setting): a real, working face detector correctly rejects the synthetic
# random-noise frames the test suite generates (there's genuinely no face in
# them), and this project deliberately avoids bundling a binary face-photo
# fixture in git. With this env var set, undetectable frames fall back to a
# center-crop instead of being skipped, so the rest of the pipeline (real
# F3-Net inference, aggregation, confidence, PDF generation) can still be
# exercised end-to-end on real model computation. A dedicated test runs
# without this flag to verify the real "no face detected" rejection path.
_TEST_FACE_FALLBACK = os.environ.get("DEEPSHIELD_TEST_FACE_FALLBACK") == "1"

FACE_CROP_SIZE = 256
# A margin around the detected face box, in pixels of the *output* crop —
# deepfake blending artifacts often sit right at the face boundary, so a
# tight crop can cut off the most informative region. DeepfakeBench's own
# margin isn't published as a simple constant (it's baked into their dlib
# preprocessing scripts), so this is a reasonable, documented choice rather
# than a reproduction of their exact numbers.
FACE_CROP_MARGIN = 40


class FaceDetector:
    """Thin wrapper around MTCNN — lazily constructed so importing this
    module never triggers a model load (the video model manager owns
    when/if this happens)."""

    def __init__(self, device: str = "cpu"):
        from facenet_pytorch import MTCNN

        self._mtcnn = MTCNN(
            image_size=FACE_CROP_SIZE,
            margin=FACE_CROP_MARGIN,
            post_process=False,
            select_largest=True,
            device=device,
        )

    def crop_face(self, frame: Image.Image) -> Image.Image | None:
        """Returns a `FACE_CROP_SIZE`x`FACE_CROP_SIZE` RGB face crop, or
        None if no face was detected in this frame."""
        try:
            tensor = self._mtcnn(frame.convert("RGB"))
        except Exception:
            logger.exception("Face detection failed on a frame; skipping it.")
            return None

        if tensor is None:
            if _TEST_FACE_FALLBACK:
                return frame.convert("RGB").resize((FACE_CROP_SIZE, FACE_CROP_SIZE))
            return None

        # post_process=False -> raw 0-255 float values, (C, H, W)
        array = tensor.permute(1, 2, 0).clamp(0, 255).byte().numpy()
        return Image.fromarray(array)

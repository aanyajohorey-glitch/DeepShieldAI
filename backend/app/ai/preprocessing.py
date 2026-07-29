"""Upload validation, storage, frame extraction, and metadata inspection —
everything that turns a raw uploaded file into a list of PIL frames (plus
descriptive metadata) ready for inference."""

import logging
import uuid
from dataclasses import dataclass
from pathlib import Path

import cv2
from fastapi import UploadFile
from PIL import Image

from app.ai.errors import DetectionError
from app.core.config import settings

logger = logging.getLogger("deepshield.preprocessing")


@dataclass
class VideoMetadata:
    width: int | None
    height: int | None
    duration_seconds: float | None
    fps: float | None
    frame_count: int | None
    codec: str | None

# Known container signatures, checked against the first bytes of the upload
# so a malicious file can't just be renamed to ".mp4" to bypass validation.
# Maps file extension -> a function that checks a header byte string.
_SIGNATURE_CHECKS = {
    ".mp4": lambda header: header[4:8] == b"ftyp",
    ".mov": lambda header: header[4:8] == b"ftyp",
    ".avi": lambda header: header[0:4] == b"RIFF" and header[8:12] == b"AVI ",
    ".mkv": lambda header: header[0:4] == b"\x1a\x45\xdf\xa3",
}


def ensure_upload_dir() -> Path:
    upload_dir = Path(settings.detection_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def validate_extension(filename: str | None) -> str:
    if not filename:
        raise DetectionError(400, "The uploaded file has no filename.")

    extension = Path(filename).suffix.lower()
    if extension not in settings.detection_allowed_extensions:
        allowed = ", ".join(settings.detection_allowed_extensions)
        raise DetectionError(
            400,
            f"Unsupported file format '{extension or 'unknown'}'. Supported formats: {allowed}.",
        )
    return extension


def _matches_signature(header: bytes, extension: str) -> bool:
    check = _SIGNATURE_CHECKS.get(extension)
    if check is None:
        return True  # no known signature to check against; fall through to OpenCV validation
    try:
        return bool(check(header))
    except Exception:  # pragma: no cover - defensive, header too short etc.
        return False


def save_upload_streaming(upload_file: UploadFile, extension: str) -> tuple[Path, int]:
    """Stream the upload to a temp file, enforcing the max size limit and a
    file-signature check while writing, so oversized or spoofed files never
    fully land on disk."""
    upload_dir = ensure_upload_dir()
    max_bytes = settings.detection_max_upload_mb * 1024 * 1024
    temp_path = upload_dir / f"{uuid.uuid4().hex}{extension}"

    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB
    is_first_chunk = True

    try:
        with open(temp_path, "wb") as destination:
            while True:
                chunk = upload_file.file.read(chunk_size)
                if not chunk:
                    break

                if is_first_chunk:
                    if not _matches_signature(chunk[:16], extension):
                        raise DetectionError(
                            400,
                            f"The file's contents do not match a valid {extension} video. "
                            "It may be corrupted or mislabeled.",
                        )
                    is_first_chunk = False

                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise DetectionError(
                        413,
                        f"File exceeds the maximum allowed size of {settings.detection_max_upload_mb}MB.",
                    )
                destination.write(chunk)
    except DetectionError:
        temp_path.unlink(missing_ok=True)
        raise
    except OSError as error:
        temp_path.unlink(missing_ok=True)
        logger.exception("Failed to save upload to disk")
        raise DetectionError(500, "Failed to save the uploaded file.") from error

    if total_bytes == 0:
        temp_path.unlink(missing_ok=True)
        raise DetectionError(400, "The uploaded file is empty.")

    return temp_path, total_bytes


def _decode_fourcc(fourcc_int: int) -> str | None:
    chars = "".join(chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)).strip("\x00").strip()
    return chars or None


def extract_metadata(video_path: Path) -> VideoMetadata:
    """Reads container-level metadata without decoding any frame data."""
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        raise DetectionError(422, "The uploaded file is not a valid or supported video.")

    try:
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)) or None
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)) or None
        fps = capture.get(cv2.CAP_PROP_FPS) or None
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) or None
        duration = round(frame_count / fps, 2) if frame_count and fps else None
        codec = _decode_fourcc(int(capture.get(cv2.CAP_PROP_FOURCC)))
    finally:
        capture.release()

    return VideoMetadata(
        width=width,
        height=height,
        duration_seconds=duration,
        fps=round(fps, 2) if fps else None,
        frame_count=frame_count,
        codec=codec,
    )


def _resize_if_needed(frame):
    """Downscales frames larger than `detection_max_frame_dimension` before
    color conversion — the model resizes to its own fixed input size
    regardless, so this only trims conversion/memory overhead on large
    source videos (e.g. 4K), it never changes what the model sees at a
    meaningful resolution."""
    height, width = frame.shape[:2]
    max_dim = settings.detection_max_frame_dimension
    longest_edge = max(height, width)
    if longest_edge <= max_dim:
        return frame

    scale = max_dim / longest_edge
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)


def extract_frames(video_path: Path) -> list[Image.Image]:
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        raise DetectionError(422, "The uploaded file is not a valid or supported video.")

    try:
        fps = capture.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 25.0  # sensible fallback for videos with unreliable metadata

        frame_interval = max(1, round(fps * settings.detection_frame_sample_seconds))

        frames: list[Image.Image] = []
        frame_index = 0

        while len(frames) < settings.detection_max_frames:
            success, frame = capture.read()
            if not success:
                break

            if frame_index % frame_interval == 0:
                frame = _resize_if_needed(frame)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(Image.fromarray(rgb_frame))

            frame_index += 1
    finally:
        capture.release()

    if not frames:
        raise DetectionError(422, "Could not extract any frames from the video. The file may be corrupted.")

    return frames

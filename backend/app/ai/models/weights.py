"""Downloads and caches the F3-Net checkpoint from DeepfakeBench's GitHub
release the first time it's needed, so it never has to be committed to git
or bundled in the Docker image. Subsequent starts reuse the cached file."""

import hashlib
import logging
from pathlib import Path

import requests

logger = logging.getLogger("deepshield.model_weights")

F3NET_CHECKPOINT_URL = "https://github.com/SCLBD/DeepfakeBench/releases/download/v1.0.1/f3net_best.pth"
F3NET_CHECKPOINT_FILENAME = "f3net_best.pth"
# Reported size from the GitHub release (~86MB) — used as a sanity check
# against a truncated/corrupted download, not a strict hash pin.
F3NET_CHECKPOINT_MIN_BYTES = 80_000_000


def ensure_f3net_weights(weights_dir: str | Path) -> Path:
    """Returns the local path to the F3-Net checkpoint, downloading it into
    `weights_dir` first if it isn't already cached there."""
    weights_dir = Path(weights_dir)
    weights_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = weights_dir / F3NET_CHECKPOINT_FILENAME

    if checkpoint_path.exists() and checkpoint_path.stat().st_size >= F3NET_CHECKPOINT_MIN_BYTES:
        return checkpoint_path

    logger.info("F3-Net checkpoint not found locally — downloading from %s ...", F3NET_CHECKPOINT_URL)
    tmp_path = checkpoint_path.with_suffix(".part")
    try:
        with requests.get(F3NET_CHECKPOINT_URL, stream=True, timeout=120) as response:
            response.raise_for_status()
            downloaded = 0
            with open(tmp_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    f.write(chunk)
                    downloaded += len(chunk)

        if downloaded < F3NET_CHECKPOINT_MIN_BYTES:
            raise RuntimeError(
                f"Downloaded F3-Net checkpoint is only {downloaded} bytes "
                f"(expected at least {F3NET_CHECKPOINT_MIN_BYTES}) — likely truncated or an error page."
            )

        tmp_path.replace(checkpoint_path)
        logger.info("F3-Net checkpoint downloaded to %s (%.1f MB).", checkpoint_path, downloaded / 1_000_000)
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise

    return checkpoint_path


def file_sha256(path: str | Path) -> str:
    """Not used for validation (no published hash to pin against), but
    useful for logging/debugging which exact checkpoint file is loaded."""
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

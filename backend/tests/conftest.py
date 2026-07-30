"""Shared pytest fixtures.

Points the app at an isolated on-disk SQLite database (set via env var
*before* app.core.config is imported) so the test suite never touches the
developer's real deepshield.db.
"""

import os
from pathlib import Path

TEST_DB_PATH = Path(__file__).parent / "test_deepshield.db"
TEST_UPLOAD_DIR = Path(__file__).parent / "test_tmp_uploads"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["DETECTION_UPLOAD_DIR"] = str(TEST_UPLOAD_DIR)
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production-use"
# The full suite now makes more than 10 /analyze calls (video + image +
# validation-rejection tests all share one rate-limited test user) — raise
# the limit for the test session rather than the production default.
os.environ["RATE_LIMIT_MAX_REQUESTS"] = "50"
# See app/ai/face_detection.py — lets synthetic no-face test videos still
# exercise the real F3-Net pipeline instead of being rejected outright.
os.environ["DEEPSHIELD_TEST_FACE_FALLBACK"] = "1"

import cv2  # noqa: E402
import numpy as np  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _cleanup_test_artifacts():
    yield
    # Dispose pooled connections first — on Windows, SQLite keeps the file
    # handle open until every connection is closed, which would otherwise
    # make the unlink() below fail with a PermissionError.
    from app.db.session import engine

    engine.dispose()
    TEST_DB_PATH.unlink(missing_ok=True)
    if TEST_UPLOAD_DIR.exists():
        for leftover in TEST_UPLOAD_DIR.iterdir():
            leftover.unlink(missing_ok=True)
        TEST_UPLOAD_DIR.rmdir()


@pytest.fixture(scope="session")
def client():
    # Using TestClient as a context manager runs the app's lifespan (table
    # creation + AI model load) once for the whole test session.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def sample_video_bytes(tmp_path_factory) -> bytes:
    """A tiny synthetic MP4 (random-noise frames) for exercising the real
    video pipeline without bundling a binary fixture in the repo."""
    video_path = tmp_path_factory.mktemp("videos") / "sample.mp4"
    writer = cv2.VideoWriter(str(video_path), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 64))
    rng = np.random.default_rng(7)
    for _ in range(20):
        frame = rng.integers(0, 255, (64, 64, 3), dtype=np.uint8)
        writer.write(frame)
    writer.release()
    return video_path.read_bytes()


@pytest.fixture(scope="session")
def sample_image_bytes(tmp_path_factory) -> bytes:
    """A tiny synthetic JPEG (random-noise pixels — no real face) for
    exercising the image upload path without bundling a binary fixture."""
    from PIL import Image as PILImage

    image_path = tmp_path_factory.mktemp("images") / "sample.jpg"
    rng = np.random.default_rng(11)
    array = rng.integers(0, 255, (128, 128, 3), dtype=np.uint8)
    PILImage.fromarray(array).save(image_path, format="JPEG")
    return image_path.read_bytes()


@pytest.fixture(scope="session")
def auth_headers(client: TestClient) -> dict[str, str]:
    """Registers (if needed) and logs in a dedicated test user, returning
    ready-to-use Authorization headers shared across the detection tests."""
    email = "pytest.user@deepshield.ai"
    password = "PytestPass123"

    client.post(
        "/api/auth/register",
        json={"name": "Pytest User", "email": email, "password": password},
    )
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}

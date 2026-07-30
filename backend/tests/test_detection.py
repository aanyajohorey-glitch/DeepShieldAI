import pytest


@pytest.fixture(scope="module")
def analyzed_result(client, auth_headers, sample_video_bytes):
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("sample.mp4", sample_video_bytes, "video/mp4")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_analyze_returns_expected_shape(analyzed_result):
    assert analyzed_result["prediction"] in ("REAL", "DEEPFAKE")
    assert 0 <= analyzed_result["confidence"] <= 100
    assert analyzed_result["riskLevel"] in ("Low", "Medium", "High")
    assert analyzed_result["framesProcessed"] > 0
    assert analyzed_result["processingTime"] > 0
    assert analyzed_result["explanation"]
    assert "F3-Net" in analyzed_result["modelUsed"]
    assert analyzed_result["fileType"] == "video"


def test_analyze_includes_explainability_fields(analyzed_result):
    """Phase 4: per-frame breakdown, certainty/consistency stats, and
    heuristics must all be real, well-formed data — not placeholders."""
    assert isinstance(analyzed_result["frameScores"], list)
    assert len(analyzed_result["frameScores"]) == analyzed_result["framesProcessed"]
    assert all(0 <= score <= 100 for score in analyzed_result["frameScores"])
    assert 0 <= analyzed_result["temporalConsistency"] <= 100
    assert 0 <= analyzed_result["modelCertainty"] <= 100
    assert "averageSharpness" in analyzed_result["heuristics"]


def test_analyze_includes_video_metadata(analyzed_result):
    """Phase 4: real container metadata extracted via OpenCV, matching the
    64x64 synthetic clip the `sample_video_bytes` fixture generates."""
    metadata = analyzed_result["metadata"]
    assert metadata["width"] == 64
    assert metadata["height"] == 64
    assert metadata["fps"] is not None
    assert metadata["durationSeconds"] is not None
    assert metadata["fileSizeBytes"] is not None


@pytest.fixture(scope="module")
def analyzed_image_result(client, auth_headers, sample_image_bytes):
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("sample.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_analyze_image_routes_to_image_detector(analyzed_image_result):
    """Phase 6 (dual detection): a jpg upload must be routed to the image
    detector automatically — the user never chooses. framesProcessed is
    always 1 for a still image (there's only one frame to score)."""
    assert analyzed_image_result["fileType"] == "image"
    assert analyzed_image_result["prediction"] in ("REAL", "DEEPFAKE")
    assert 0 <= analyzed_image_result["confidence"] <= 100
    assert analyzed_image_result["framesProcessed"] == 1
    assert "dima806" in analyzed_image_result["modelUsed"]
    assert "image" in analyzed_image_result["explanation"].lower()


def test_analyze_image_metadata_has_no_video_fields(analyzed_image_result):
    """An image has width/height but no duration/fps/frameCount — those
    must come back null rather than fabricated."""
    metadata = analyzed_image_result["metadata"]
    assert metadata["width"] == 128
    assert metadata["height"] == 128
    assert metadata["durationSeconds"] is None
    assert metadata["fps"] is None
    assert metadata["frameCount"] is None


def test_analyze_rejects_unsupported_image_extension(client, auth_headers):
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("notes.gif", b"GIF89a" + b"\x00" * 32, "image/gif")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_analyze_rejects_spoofed_image_extension(client, auth_headers):
    """A .jpg-named file whose bytes don't match the real JPEG signature
    must be rejected, mirroring the existing video spoofing check."""
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("fake.png", b"this is not really a png file", "image/png")},
    )
    assert response.status_code == 400
    assert "do not match" in response.json()["detail"]


def test_analyze_video_rejects_no_detectable_face(client, auth_headers, sample_video_bytes, monkeypatch):
    """With the test-only face-detection fallback disabled, a video with no
    real face (the synthetic random-noise fixture) must be rejected by the
    real MTCNN detector — this is the actual production behavior; the
    fallback in every other test exists only because bundling a real face
    photo as a binary git fixture isn't appropriate here (see
    app/ai/face_detection.py)."""
    import app.ai.face_detection as face_detection_module

    monkeypatch.setattr(face_detection_module, "_TEST_FACE_FALLBACK", False)
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("noface.mp4", sample_video_bytes, "video/mp4")},
    )
    assert response.status_code == 422
    assert "No face could be detected" in response.json()["detail"]


def test_analyze_requires_authentication(client, sample_video_bytes):
    response = client.post(
        "/api/detection/analyze",
        files={"file": ("sample.mp4", sample_video_bytes, "video/mp4")},
    )
    assert response.status_code == 401


def test_analyze_rejects_unsupported_extension(client, auth_headers):
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("notes.txt", b"hello world", "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_analyze_rejects_spoofed_extension(client, auth_headers):
    """A .mp4-named file whose bytes don't match the real MP4 signature
    must be rejected — this is the magic-byte validation added in Phase 3."""
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("fake.mp4", b"this is not really an mp4 file", "video/mp4")},
    )
    assert response.status_code == 400
    assert "do not match" in response.json()["detail"]


def test_analyze_rejects_empty_file(client, auth_headers):
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("empty.mp4", b"", "video/mp4")},
    )
    assert response.status_code == 400


def test_analyze_rejects_oversized_file(client, auth_headers, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "detection_max_upload_mb", 0)

    valid_mp4_header = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 64
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("big.mp4", valid_mp4_header, "video/mp4")},
    )
    assert response.status_code == 413
    assert "exceeds the maximum allowed size" in response.json()["detail"]


def test_analyze_rejects_corrupted_video_body(client, auth_headers):
    """A file with a genuine MP4 signature but a body OpenCV can't decode
    must fail validation, not crash the pipeline."""
    fake_mp4 = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 200
    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("corrupt.mp4", fake_mp4, "video/mp4")},
    )
    assert response.status_code == 422


def test_history_includes_analyzed_result(client, auth_headers, analyzed_result):
    response = client.get("/api/detection/history", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert any(item["id"] == analyzed_result["id"] for item in body["items"])


def test_get_by_id_returns_the_record(client, auth_headers, analyzed_result):
    response = client.get(f"/api/detection/{analyzed_result['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == analyzed_result["id"]


def test_get_by_id_not_found(client, auth_headers):
    response = client.get("/api/detection/999999", headers=auth_headers)
    assert response.status_code == 404


def test_get_by_id_is_scoped_to_owner(client, analyzed_result):
    """Another user must not be able to view someone else's scan by id."""
    register_response = client.post(
        "/api/auth/register",
        json={"name": "Other User", "email": "other.user@deepshield.ai", "password": "OtherUser123"},
    )
    assert register_response.status_code == 201
    other_token = register_response.json()["accessToken"]

    response = client.get(
        f"/api/detection/{analyzed_result['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 404


def test_pdf_report_returns_valid_pdf(client, auth_headers, analyzed_result):
    response = client.get(f"/api/detection/{analyzed_result['id']}/report/pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:4] == b"%PDF"


def test_pdf_report_requires_authentication(client, analyzed_result):
    response = client.get(f"/api/detection/{analyzed_result['id']}/report/pdf")
    assert response.status_code == 401


def test_pdf_report_for_image_result_is_valid(client, auth_headers, analyzed_image_result):
    response = client.get(f"/api/detection/{analyzed_image_result['id']}/report/pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"


def test_pdf_report_not_found(client, auth_headers):
    response = client.get("/api/detection/999999/report/pdf", headers=auth_headers)
    assert response.status_code == 404


def test_delete_then_confirm_gone(client, auth_headers, analyzed_result):
    delete_response = client.delete(f"/api/detection/{analyzed_result['id']}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/detection/{analyzed_result['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_delete_removes_heatmap_file(client, auth_headers, sample_video_bytes):
    """Phase 5: deleting a detection must also remove its heatmap PNG from
    disk, not just the DB row — otherwise orphaned files accumulate forever."""
    from pathlib import Path

    from app.core.config import settings

    response = client.post(
        "/api/detection/analyze",
        headers=auth_headers,
        files={"file": ("heatmap_check.mp4", sample_video_bytes, "video/mp4")},
    )
    assert response.status_code == 201
    data = response.json()
    heatmap_url = data.get("heatmapUrl")
    if not heatmap_url:
        pytest.skip("No heatmap generated for this result; nothing to verify cleanup for.")

    heatmap_path = Path(settings.heatmap_dir) / Path(heatmap_url).name
    assert heatmap_path.exists()

    delete_response = client.delete(f"/api/detection/{data['id']}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert not heatmap_path.exists()

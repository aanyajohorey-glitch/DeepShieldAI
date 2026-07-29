from app.ai import model_loader


def test_model_is_ready_after_startup(client):
    """`client` triggers the app's lifespan (and therefore model loading)
    via the TestClient context manager in conftest.py."""
    assert model_loader.is_model_ready() is True


def test_model_info_reports_expected_contract(client):
    info = model_loader.model_info()
    assert info is not None
    assert info.name == "dima806/deepfake_vs_real_image_detection"
    assert info.device in ("CPU", "GPU")
    assert info.load_duration_seconds is not None and info.load_duration_seconds >= 0

    lower_labels = {label.lower() for label in info.labels}
    assert {"real", "fake"} <= lower_labels


def test_pipeline_and_model_accessors_are_consistent(client):
    pipeline = model_loader.get_pipeline()
    model = model_loader.get_model()
    processor = model_loader.get_image_processor()

    assert pipeline.model is model
    assert pipeline.image_processor is processor

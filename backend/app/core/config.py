from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration, loaded from environment variables
    or a local .env file. This is the single place configurable values live
    — avoid hardcoding them elsewhere in the app."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DeepShield AI"
    app_version: str = "0.1.0"
    environment: str = "development"

    database_url: str = "sqlite:///./deepshield.db"

    secret_key: str = "CHANGE_ME_IN_PRODUCTION_ENV_FILE"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Deepfake detection — model & pipeline
    detection_model_name: str = "dima806/deepfake_vs_real_image_detection"
    detection_upload_dir: str = "./tmp_uploads"
    detection_max_upload_mb: int = 200
    detection_allowed_extensions: list[str] = [".mp4", ".mov", ".avi", ".mkv"]
    detection_frame_sample_seconds: float = 1.0
    detection_max_frames: int = 30
    detection_fake_threshold: float = 0.5
    detection_max_frame_dimension: int = 720
    """Frames wider or taller than this (px) are downscaled before inference
    — the model resizes to its own fixed input size regardless, so this only
    saves conversion/memory overhead on large source videos."""

    # Explainable AI
    detection_enable_heatmap: bool = True
    """Generates an attention-rollout visualization for the most-suspicious
    sampled frame. Adds one extra forward pass per analysis — disable for
    lower latency if the visualization isn't needed."""
    heatmap_dir: str = "./static/heatmaps"

    # Rate limiting
    rate_limit_max_requests: int = 10
    rate_limit_window_seconds: int = 60

    # Logging
    log_dir: str = "./logs"
    log_level: str = "INFO"


settings = Settings()

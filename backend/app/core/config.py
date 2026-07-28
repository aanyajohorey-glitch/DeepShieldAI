from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration, loaded from environment variables
    or a local .env file. Add new settings here as future phases introduce
    them (e.g. AI model paths, storage buckets)."""

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

    # Deepfake detection
    detection_model_name: str = "dima806/deepfake_vs_real_image_detection"
    detection_upload_dir: str = "./tmp_uploads"
    detection_max_upload_mb: int = 200
    detection_allowed_extensions: list[str] = [".mp4", ".mov", ".avi", ".mkv"]
    detection_frame_sample_seconds: float = 1.0
    detection_max_frames: int = 30
    detection_fake_threshold: float = 0.5


settings = Settings()

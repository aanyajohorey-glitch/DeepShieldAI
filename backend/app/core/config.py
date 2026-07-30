import json

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET_KEY = "CHANGE_ME_IN_PRODUCTION_ENV_FILE"


def _split_csv_or_json(value: object) -> object:
    """Accept a list value from either JSON (`["a","b"]`) or a plain
    comma-separated string (`a,b`) — most PaaS env-var UIs (Render, Railway,
    etc.) make typing a JSON array awkward, so a bare CSV string must work
    too."""
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("["):
            return json.loads(stripped)
        return [item.strip() for item in stripped.split(",") if item.strip()]
    return value


class Settings(BaseSettings):
    """Central application configuration, loaded from environment variables
    or a local .env file. This is the single place configurable values live
    — avoid hardcoding them elsewhere in the app."""

    # enable_decoding=False: pydantic-settings would otherwise try to
    # JSON-decode any list-typed field's raw env-var string *before* our
    # `_parse_list_env` validator below ever runs, and raise a hard
    # SettingsError on a plain comma-separated value instead of falling
    # through to it. Disabling it hands the raw string straight to our
    # validator, which handles both JSON and CSV forms itself.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", enable_decoding=False)

    app_name: str = "DeepShield AI"
    app_version: str = "0.1.0"
    environment: str = "development"

    database_url: str = "sqlite:///./deepshield.db"

    secret_key: str = DEFAULT_SECRET_KEY
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Deepfake detection — image pipeline (dima806 ViT classifier)
    detection_model_name: str = "dima806/deepfake_vs_real_image_detection"
    detection_upload_dir: str = "./tmp_uploads"
    detection_max_upload_mb: int = 200
    # Kept as the "video extensions" setting under its original name for
    # backward compatibility with existing .env files from earlier phases —
    # detection_allowed_image_extensions (below) is the new, additive one.
    detection_allowed_extensions: list[str] = [".mp4", ".mov", ".avi", ".mkv"]
    detection_allowed_image_extensions: list[str] = [".jpg", ".jpeg", ".png", ".webp"]
    detection_frame_sample_seconds: float = 2.0
    detection_max_frames: int = 10
    """These two govern video frame sampling only — image uploads never call
    extract_frames(). Kept lower than the Phase 4 defaults (1.0s / 30
    frames) since F3-Net + MTCNN face cropping cost roughly 3-4s/frame on
    CPU in this project's testing (each frame needs its own face-detection
    pass plus a full Xception forward pass) — the old per-frame ViT image
    classifier was far cheaper per frame. 30 frames at that cost risks
    exceeding typical reverse-proxy timeouts (Cloudflare Tunnel, Render,
    browsers) before a response ever comes back. Raise these if you have
    GPU inference or don't mind longer waits."""
    detection_fake_threshold: float = 0.5
    detection_max_frame_dimension: int = 720
    """Frames wider or taller than this (px) are downscaled before inference
    — the model resizes to its own fixed input size regardless, so this only
    saves conversion/memory overhead on large source videos."""

    # Deepfake detection — video pipeline (F3-Net + MTCNN face cropping)
    video_model_name: str = "F3-Net (DeepfakeBench)"
    video_model_weights_dir: str = "../models/weights"
    """Where the F3-Net checkpoint is downloaded/cached on first use — never
    committed to git (see models/README.md)."""
    video_model_resolution: int = 256
    video_fake_threshold: float = 0.5
    """F3-Net's own decision threshold — kept separate from
    detection_fake_threshold since the two models were trained/calibrated
    independently and there's no reason their thresholds should match."""

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

    @field_validator(
        "cors_origins", "detection_allowed_extensions", "detection_allowed_image_extensions", mode="before"
    )
    @classmethod
    def _parse_list_env(cls, value: object) -> object:
        return _split_csv_or_json(value)

    @model_validator(mode="after")
    def _reject_default_secret_in_production(self) -> "Settings":
        if self.environment == "production" and self.secret_key == DEFAULT_SECRET_KEY:
            raise ValueError(
                "SECRET_KEY is still the default placeholder value while ENVIRONMENT=production. "
                "Set a real, random SECRET_KEY in your environment before deploying — anyone who "
                "reads the public source would otherwise be able to forge login tokens."
            )
        return self


settings = Settings()

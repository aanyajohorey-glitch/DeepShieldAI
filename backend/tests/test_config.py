import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_cors_origins_accepts_json_array_string():
    settings = Settings(cors_origins='["https://a.example.com","https://b.example.com"]')
    assert settings.cors_origins == ["https://a.example.com", "https://b.example.com"]


def test_cors_origins_accepts_plain_csv_string():
    """Phase 5: PaaS env-var UIs (Render, etc.) make typing a JSON array
    awkward — a bare comma-separated value must work too."""
    settings = Settings(cors_origins="https://a.example.com, https://b.example.com")
    assert settings.cors_origins == ["https://a.example.com", "https://b.example.com"]


def test_cors_origins_accepts_single_csv_value():
    settings = Settings(cors_origins="https://a.example.com")
    assert settings.cors_origins == ["https://a.example.com"]


def test_cors_origins_defaults_when_unset():
    settings = Settings()
    assert "http://localhost:3000" in settings.cors_origins


def test_detection_allowed_extensions_accepts_csv_string():
    settings = Settings(detection_allowed_extensions=".mp4, .mov")
    assert settings.detection_allowed_extensions == [".mp4", ".mov"]


def test_rejects_default_secret_key_in_production():
    """Phase 5: deploying with ENVIRONMENT=production and the placeholder
    SECRET_KEY would let anyone forge login tokens using the public source —
    startup must fail loudly instead of running insecurely."""
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(environment="production", secret_key="CHANGE_ME_IN_PRODUCTION_ENV_FILE")


def test_allows_default_secret_key_outside_production():
    """The placeholder secret is only rejected when environment=production —
    it must not block local/dev/test setups that haven't set a real one."""
    settings = Settings(environment="development", secret_key="CHANGE_ME_IN_PRODUCTION_ENV_FILE")
    assert settings.secret_key == "CHANGE_ME_IN_PRODUCTION_ENV_FILE"


def test_allows_production_with_real_secret_key():
    settings = Settings(environment="production", secret_key="a-real-random-secret")
    assert settings.environment == "production"

from datetime import datetime
from typing import Literal

from app.schemas.user import CamelModel

Prediction = Literal["REAL", "DEEPFAKE"]
RiskLevel = Literal["Low", "Medium", "High"]


class DetectionResult(CamelModel):
    id: int
    filename: str
    prediction: Prediction
    confidence: float
    risk_level: RiskLevel
    avg_frame_score: float
    explanation: str
    frames_processed: int
    processing_time: float
    model_used: str
    created_at: datetime


class DetectionHistoryResponse(CamelModel):
    total: int
    items: list[DetectionResult]

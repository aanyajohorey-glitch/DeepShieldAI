from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.detection import DetectionHistoryResponse, DetectionResult
from app.services.detection_service import (
    DetectionError,
    analyze_video,
    delete_detection,
    get_detection,
    get_history,
)

router = APIRouter(prefix="/detection", tags=["Detection"])


@router.post("/analyze", response_model=DetectionResult, status_code=status.HTTP_201_CREATED)
def analyze(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return analyze_video(db, current_user, file)
    except DetectionError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error))


@router.get("/history", response_model=DetectionHistoryResponse)
def history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = get_history(db, current_user, limit=limit, offset=offset)
    return DetectionHistoryResponse(total=total, items=items)


@router.get("/{detection_id}", response_model=DetectionResult)
def get_by_id(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    detection = get_detection(db, current_user, detection_id)
    if detection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detection record not found.")
    return detection


@router.delete("/{detection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_by_id(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_detection(db, current_user, detection_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detection record not found.")

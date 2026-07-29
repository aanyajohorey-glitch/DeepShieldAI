"""A minimal in-memory rate limiter.

This is intentionally dependency-free (no Redis) since the app runs as a
single process for this project's scope. If deployed with multiple workers,
swap this for a shared store (e.g. Redis) so limits apply across processes.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.models.user import User

_lock = Lock()
_request_log: dict[int, deque[float]] = defaultdict(deque)


def enforce_rate_limit(key: int, max_requests: int, window_seconds: int) -> None:
    now = time.monotonic()
    with _lock:
        timestamps = _request_log[key]
        while timestamps and now - timestamps[0] > window_seconds:
            timestamps.popleft()

        if len(timestamps) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Limit is {max_requests} per {window_seconds} seconds — please wait a moment and try again.",
            )

        timestamps.append(now)


def rate_limit_detection(current_user: User = Depends(get_current_user)) -> None:
    """Caps expensive AI-inference requests per user to protect the
    model/CPU from abuse or accidental request loops."""
    enforce_rate_limit(
        current_user.id,
        max_requests=settings.rate_limit_max_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )

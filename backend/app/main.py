import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.ai import model_loader
from app.api.routes import auth, detection, health
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.utils.logging_config import RequestLoggingMiddleware, configure_logging

# Import models so they register on Base.metadata before create_all runs.
from app.db import models  # noqa: F401

configure_logging()
logger = logging.getLogger("deepshield.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    model_loader.load_model()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="DeepShield AI backend — authentication, database, and AI-powered deepfake detection services.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(RequestLoggingMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort handler: never leak a raw traceback to the client, but
    still log the real exception server-side for debugging."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(detection.router, prefix="/api")


@app.get("/")
def root():
    return {"message": f"{settings.app_name} API is running.", "docs": "/docs"}

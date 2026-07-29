import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

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

_STATIC_ROOT = Path(settings.heatmap_dir).parent
_STATIC_ROOT.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s v%s starting up (%s)...", settings.app_name, settings.app_version, settings.environment)
    Base.metadata.create_all(bind=engine)
    model_loader.load_model()
    logger.info("Startup complete.")
    yield
    logger.info("%s shutting down.", settings.app_name)


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

app.mount("/static", StaticFiles(directory=str(_STATIC_ROOT)), name="static")


@app.get("/")
def root():
    return {"message": f"{settings.app_name} API is running.", "docs": "/docs"}

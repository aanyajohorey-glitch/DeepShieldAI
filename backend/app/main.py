import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, detection, health
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.services import ai_model

# Import models so they register on Base.metadata before create_all runs.
from app.db import models  # noqa: F401

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ai_model.load_model()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="DeepShield AI backend — authentication, data, and (in future phases) AI deepfake detection services.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(detection.router, prefix="/api")


@app.get("/")
def root():
    return {"message": f"{settings.app_name} API is running.", "docs": "/docs"}

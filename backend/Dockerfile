# DeepShield AI backend — FastAPI + pretrained deepfake detection model.
FROM python:3.14-slim

WORKDIR /app

# opencv-python-headless still needs a couple of system shared libs on slim Debian.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-nodeps.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir --no-deps -r requirements-nodeps.txt

COPY app ./app

RUN mkdir -p /app/data /app/tmp_uploads /app/models/weights

ENV PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////app/data/deepshield.db \
    DETECTION_UPLOAD_DIR=/app/tmp_uploads \
    VIDEO_MODEL_WEIGHTS_DIR=/app/models/weights

EXPOSE 8000

# First container start downloads the image model from Hugging Face and the
# F3-Net video-model checkpoint from GitHub, caching both in the container's
# filesystem (or a mounted volume, if you add one for /app/models) —
# expect a slower first boot.
# Shell form (not exec form) so $PORT expands — PaaS hosts like Render inject
# their own PORT at runtime; local `docker run`/compose falls back to 8000.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

# DeepShield AI backend — FastAPI + pretrained deepfake detection model.
FROM python:3.14-slim

WORKDIR /app

# opencv-python-headless still needs a couple of system shared libs on slim Debian.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /app/data /app/tmp_uploads

ENV PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////app/data/deepshield.db \
    DETECTION_UPLOAD_DIR=/app/tmp_uploads

EXPOSE 8000

# First container start downloads the pretrained model from Hugging Face and
# caches it in the image layer/volume — expect a slower first boot.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

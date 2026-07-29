# Datasets

## Purpose

This folder documents the data used by DeepShield AI's deepfake detection
pipeline: where the AI model's underlying training data came from, and what
data (if any) this repository itself stores or expects locally.

## Current status: inference-only, no local training dataset

DeepShield AI (Phase 2) performs **inference only** using a pretrained,
publicly hosted model — it does **not** train or fine-tune a model, and this
repository does **not** contain a training dataset. This was a deliberate
scope decision (see the project README's Problem Statement) so the platform
could ship a working detector without the cost and complexity of curating
and training on a deepfake corpus.

As a result:

- `datasets/raw/` and `datasets/processed/` are currently **empty** (kept in
  git via `.gitkeep` so the structure exists for future phases).
- No dataset files are downloaded, generated, or committed by the app today.
- The "dataset" that matters right now is the one the pretrained model was
  originally trained on by its author — see `dataset_info.md`.

## Which data is used for what today

| Purpose | Data | Where it lives |
|---|---|---|
| Model training | Pretrained model's original training set (not ours) | Hugging Face Hub, see `dataset_info.md` |
| Runtime inference | User-uploaded video, sampled into frames | Streamed to a temp file, deleted after analysis — never persisted |
| Manual QA during development | Short synthetic test clips (random noise frames) generated with OpenCV | Not committed to the repo |

No end-user videos are stored: `backend/app/services/detection_service.py`
writes the upload to a temp file only for the duration of frame extraction
and inference, then deletes it in a `finally` block. The database stores only
the *result* of a scan (verdict, confidence, timestamps) — never the video
itself.

## Dataset sources and format

See [`dataset_info.md`](./dataset_info.md) for the pretrained model's
documented training data, class labels, and preprocessing.

## How datasets are prepared for inference

1. A user uploads a video (`.mp4`, `.mov`, `.avi`, `.mkv`, ≤200MB).
2. OpenCV samples frames at a configurable interval (default: 1 frame/second,
   capped at 30 frames per video — see `detection_frame_sample_seconds` and
   `detection_max_frames` in `backend/app/core/config.py`).
3. Each frame is converted from BGR to RGB and wrapped as a PIL image.
4. Frames are batched through the Hugging Face `image-classification`
   pipeline, which applies the model's own preprocessing (resize/normalize
   to the ViT's expected input) internally — no manual preprocessing step is
   needed on our side.

## How this connects to the AI model

`backend/app/ai/model_loader.py` loads the model named in
`Settings.detection_model_name` (`app/core/config.py`) once at startup.
`app/services/detection_service.py` orchestrates each request through the
`app/ai/` pipeline — it never touches raw dataset files, only the frames
extracted at request time.

## If a future phase adds a training/fine-tuning dataset

- **Do not commit raw video/image datasets to git.** They are excluded via
  the root `.gitignore` (`datasets/raw/*`, `datasets/processed/*`, and
  common archive/model-weight extensions).
- Host the dataset externally (e.g. a cloud bucket, Kaggle, or Hugging Face
  Datasets) and document the download steps in `dataset_info.md`.
- For large binary assets that *do* need to live alongside the code (e.g. a
  fine-tuned checkpoint), use [Git LFS](https://git-lfs.com/) rather than
  committing them directly.

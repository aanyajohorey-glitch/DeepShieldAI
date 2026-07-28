# Models

DeepShield AI does not store model weights in this repository. The deepfake
detection model is downloaded automatically from the Hugging Face Hub the
first time the backend starts, then cached locally by the `transformers`
library (typically under `~/.cache/huggingface`) — outside this project
directory.

## Model in use

| Field | Value |
|---|---|
| Model | [`dima806/deepfake_vs_real_image_detection`](https://huggingface.co/dima806/deepfake_vs_real_image_detection) |
| Task | Image classification (`Real` vs `Fake`), applied per sampled video frame |
| Architecture | Vision Transformer (`google/vit-base-patch16-224-in21k`, fine-tuned) |
| Loaded by | `backend/app/services/ai_model.py`, once at FastAPI startup |
| Configured via | `detection_model_name` in `backend/app/core/config.py` / `.env` |
| Compute | Runs on GPU if `torch.cuda.is_available()`, otherwise falls back to CPU automatically |

See [`../datasets/dataset_info.md`](../datasets/dataset_info.md) for what is
known about the data this model was originally trained on.

## Swapping in a different model

To use a different Hugging Face image-classification model, set
`DETECTION_MODEL_NAME` in `backend/.env` to its repo id. The model must
output labels containing `Real`/`Fake` (or be adapted in
`app/services/detection_service.py`'s `_run_inference` function, which maps
label names to a fake-probability score).

## If you fine-tune your own model

Do not commit model weight files (`*.pt`, `*.pth`, `*.onnx`, `*.ckpt`, etc.)
directly to git — they are excluded by the root `.gitignore`. Either:

- Publish the fine-tuned model to the Hugging Face Hub and point
  `DETECTION_MODEL_NAME` at it (same pattern as today), or
- Use [Git LFS](https://git-lfs.com/) if the weights must live in this repo.

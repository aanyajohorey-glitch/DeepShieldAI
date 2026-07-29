# Models

DeepShield AI does not store model weights in this repository. The deepfake
detection model is downloaded automatically from the Hugging Face Hub the
first time the backend starts, then cached locally by the `transformers`
library (typically under `~/.cache/huggingface`) — outside this project
directory.

The subfolders here (`trained/`, `checkpoints/`, `configs/`, `weights/`) are
reserved for future work — fine-tuning a model on a modern deepfake dataset
(see Future Improvements in the root `README.md`). They're currently empty
placeholders (kept in git via `.gitkeep`); nothing reads from them yet.

## Model in use

| Field | Value |
|---|---|
| Model | [`dima806/deepfake_vs_real_image_detection`](https://huggingface.co/dima806/deepfake_vs_real_image_detection) |
| Task | Image classification (`Real` vs `Fake`), applied per sampled video frame |
| Architecture | Vision Transformer (`google/vit-base-patch16-224-in21k`, fine-tuned) |
| Loaded by | `backend/app/ai/model_loader.py`'s `ModelManager`, once at FastAPI startup |
| Configured via | `detection_model_name` in `backend/app/core/config.py` / `.env` |
| Compute | Runs on GPU if `torch.cuda.is_available()`, otherwise falls back to CPU automatically |

See [`../datasets/dataset_info.md`](../datasets/dataset_info.md) for what is
known about the data this model was originally trained on.

## Swapping in a different model

To use a different Hugging Face image-classification model, set
`DETECTION_MODEL_NAME` in `backend/.env` to its repo id, or call
`ModelManager.switch_model()` (exposed as the module-level `switch_model()`
function in `backend/app/ai/model_loader.py`) at runtime. The model must
output labels containing `Real`/`Fake` (or be adapted in
`backend/app/ai/inference.py`, which maps label names to a fake-probability
score). `ModelManager` validates the new model's output contract before
swapping it in, so a bad model id fails loudly instead of silently breaking
predictions.

## If you fine-tune your own model

Do not commit model weight files (`*.pt`, `*.pth`, `*.onnx`, `*.ckpt`, etc.)
directly to git — they are excluded by the root `.gitignore`. Either:

- Publish the fine-tuned model to the Hugging Face Hub and point
  `DETECTION_MODEL_NAME` at it (same pattern as today), or
- Use [Git LFS](https://git-lfs.com/) if the weights must live in this repo.

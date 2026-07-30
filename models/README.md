# Models

DeepShield AI does not store model weights in this repository. Both
detection models are downloaded automatically the first time the backend
needs them, then cached locally — outside version control.

The subfolders here (`trained/`, `checkpoints/`, `configs/`, `weights/`) are
reserved for future work — fine-tuning a model on a modern deepfake dataset
(see Future Improvements in the root `README.md`). `weights/` is also where
the F3-Net checkpoint (below) gets cached at runtime; the others remain
empty placeholders (kept in git via `.gitkeep`).

DeepShield AI automatically routes an upload to the correct model based on
its file extension — the user never chooses. See the root README's
"Explainable AI Workflow" / dual-detection section for the full pipeline.

## Image model — dima806 ViT

| Field | Value |
|---|---|
| Model | [`dima806/deepfake_vs_real_image_detection`](https://huggingface.co/dima806/deepfake_vs_real_image_detection) |
| Task | Image classification (`Real` vs `Fake`) |
| Handles | Still images: `.jpg`, `.jpeg`, `.png`, `.webp` |
| Architecture | Vision Transformer (`google/vit-base-patch16-224-in21k`, fine-tuned) |
| Downloaded from | Hugging Face Hub, cached under `~/.cache/huggingface` |
| Loaded by | `backend/app/ai/model_loader.py`'s `ModelManager`, once at FastAPI startup |
| Configured via | `detection_model_name` in `backend/app/core/config.py` / `.env` |
| License | Whatever the model card on the Hub declares (check before commercial use) |

See [`../datasets/dataset_info.md`](../datasets/dataset_info.md) for what is
known about the data this model was originally trained on.

### Swapping in a different image model

To use a different Hugging Face image-classification model, set
`DETECTION_MODEL_NAME` in `backend/.env` to its repo id, or call
`ModelManager.switch_model()` (exposed as the module-level `switch_model()`
function in `backend/app/ai/model_loader.py`) at runtime. The model must
output labels containing `Real`/`Fake` (or be adapted in
`backend/app/ai/inference.py`, which maps label names to a fake-probability
score). `ModelManager` validates the new model's output contract before
swapping it in, so a bad model id fails loudly instead of silently breaking
predictions.

## Video model — F3-Net (DeepfakeBench)

| Field | Value |
|---|---|
| Model | F3-Net (Frequency in Face Forgery Network), from [SCLBD/DeepfakeBench](https://github.com/SCLBD/DeepfakeBench) |
| Task | Binary face-forgery classification (`Real` vs `Fake`), per detected face crop |
| Handles | Video: `.mp4`, `.mov`, `.avi`, `.mkv` |
| Architecture | Xception backbone + a frequency-domain decomposition head (DCT-based band-pass filters) — a different architecture family from the image model, chosen because a single-frame image classifier applied per-frame has no notion of frequency-domain forgery artifacts |
| Preprocessing | Faces are detected and cropped from sampled frames with [MTCNN](https://github.com/timesler/facenet-pytorch) — **not** DeepfakeBench's original dlib pipeline, which needs a C++ build toolchain this project deliberately avoids requiring (see `backend/app/ai/face_detection.py`) |
| Checkpoint | [`f3net_best.pth`](https://github.com/SCLBD/DeepfakeBench/releases/download/v1.0.1/f3net_best.pth) (~86MB), downloaded automatically on first use and cached in `models/weights/` |
| Loaded by | `backend/app/ai/model_loader.py`'s `VideoModelManager`, once at FastAPI startup |
| Model code | Vendored (not pip-installed — DeepfakeBench isn't a package) in `backend/app/ai/models/{xception,f3net}.py`, trimmed to inference-only; verified the released checkpoint loads with "all keys matched successfully" |
| **License** | **CC BY-NC 4.0 — non-commercial use only.** Fine for this capstone/educational project; replace this model before any commercial deployment. |

### Why a second, different model for video

A single image classifier scoring each frame independently (what earlier
phases did) has no way to use video-native or frequency-domain signal — it's
just running still-image inference N times. F3-Net is a real, published
face-forgery detector that specifically targets that gap. DeepShield AI does
not train anything; it loads DeepfakeBench's own released checkpoint,
unmodified, and only adapts the surrounding preprocessing (face
cropping) and glue code needed to run inference outside the original
training framework.

### If you fine-tune your own model

Do not commit model weight files (`*.pt`, `*.pth`, `*.onnx`, `*.ckpt`, etc.)
directly to git — they are excluded by the root `.gitignore`. Either:

- Publish the fine-tuned model to the Hugging Face Hub and point
  `DETECTION_MODEL_NAME` at it (image model), or
- Point `video_model_weights_dir` / the checkpoint download URL at your own
  release (video model — see `backend/app/ai/models/weights.py`), or
- Use [Git LFS](https://git-lfs.com/) if the weights must live in this repo.

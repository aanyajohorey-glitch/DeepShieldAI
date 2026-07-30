# Dataset Info

This document describes the data behind the two AI models DeepShield AI
calls at inference time — one for images, one for video. DeepShield AI does
not train either model or own either dataset — it consumes both as
pretrained artifacts. Fields we could not verify from public documentation
are marked **Not publicly specified**.

## Image model — dima806 ViT (used for still-image uploads)

| Field | Value |
|---|---|
| Dataset name | Deepfake and real face images (as referenced by the model author's Kaggle notebook) |
| Dataset source | Kaggle, via the notebook [`dima806/deepfake-vs-real-faces-detection-vit`](https://www.kaggle.com/code/dima806/deepfake-vs-real-faces-detection-vit) |
| Model card | [`dima806/deepfake_vs_real_image_detection`](https://huggingface.co/dima806/deepfake_vs_real_image_detection) on Hugging Face |
| Number of samples | Not publicly specified in the model card |
| Classes / categories | 2 — `Real`, `Fake` |
| Training data details | Not publicly specified (image count/split not disclosed by the author) |
| Testing / validation data details | Not publicly specified |
| Base architecture | `google/vit-base-patch16-224-in21k` (Vision Transformer), fine-tuned for binary classification |
| Preprocessing steps | Handled internally by the Hugging Face `image-classification` pipeline's `AutoImageProcessor` (resize to 224×224, normalization) — DeepShield AI does not reimplement this |
| Known limitations | The model author's card notes the training data is several years old and warns of **concept drift**: modern AI-generated images are harder to detect than the deepfakes the model was originally trained on. DeepShield AI surfaces the model's raw confidence score rather than hiding this uncertainty. |

## Video model — F3-Net (used for video uploads)

| Field | Value |
|---|---|
| Model | F3-Net (Frequency in Face Forgery Network), from [SCLBD/DeepfakeBench](https://github.com/SCLBD/DeepfakeBench) |
| Checkpoint used | [`f3net_best.pth`](https://github.com/SCLBD/DeepfakeBench/releases/download/v1.0.1/f3net_best.pth) — DeepfakeBench's own released, best-performing checkpoint for this detector |
| Training dataset | FaceForensics++ (specifically the `FF-NT` split — NeuralTextures manipulations, per DeepfakeBench's published config for this detector) |
| Evaluation datasets (per DeepfakeBench's benchmark) | FaceForensics++, FF-F2F, FF-DF, FF-FS, FF-NT |
| Classes / categories | 2 — `Real`, `Fake` |
| Base architecture | Xception, with a frequency-domain decomposition head (DCT-based band-pass filters) feeding a widened first conv layer |
| Preprocessing (DeepShield AI's implementation) | Faces detected and cropped via MTCNN (not DeepfakeBench's original dlib pipeline — see `models/README.md` for why), resized to 256×256, normalized to mean/std 0.5 per channel |
| **License** | **CC BY-NC 4.0 — non-commercial use only.** See `models/README.md`. |
| Known limitations | FaceForensics++ manipulations are several years old at this point; like the image model, this carries a concept-drift risk against very recent generative techniques. DeepShield AI does not claim otherwise. |

## Usage in DeepShield AI

DeepShield AI does not retrain or fine-tune either model — both are loaded
once at backend startup (`app/ai/model_loader.py`'s `ModelManager` and
`VideoModelManager`) and used purely for inference. Which model runs is
chosen automatically from the upload's file extension
(`app/ai/preprocessing.py`'s `classify_file_type()`):

- **Images** are classified directly by the ViT model (`app/ai/image_detector.py` → `app/ai/inference.py`).
- **Video** frames are extracted by OpenCV, each face-cropped by MTCNN, and
  scored by F3-Net (`app/ai/video_detector.py`); frames with no detectable
  face are skipped. Per-frame/per-face `Fake` probabilities are aggregated
  into the overall verdict, confidence, and risk level
  (`app/ai/postprocessing.py`, `app/ai/confidence.py`, orchestrated by
  `app/ai/prediction_service.py`).

## DeepShield AI's own test data (development QA, not a shipped dataset)

To validate the pipelines end-to-end during development, synthetic test
assets were generated locally rather than using copyrighted or third-party
footage:

- **Video**: short clips generated with OpenCV (random-noise frames), used
  to confirm the upload → routing → inference → aggregation → API response
  pipeline behaves correctly, not to benchmark detection accuracy. Since
  these frames genuinely contain no face, they exercise a documented
  test-only fallback in the face-detection step (see
  `app/ai/face_detection.py` and the Testing section of the root README) —
  a dedicated test confirms the real "no face detected" rejection also
  works correctly, without that fallback.
- **Images**: small synthetic JPEGs (random-noise pixels), same purpose.
- Neither is included in this repository; both can be regenerated with a
  few lines of OpenCV/Pillow if you need a throwaway file for local testing.

## Obtaining real evaluation data

If you want to evaluate detection accuracy rather than just pipeline
plumbing, you will need labeled data of your own — this project does not
bundle any. For video, [FaceForensics++](https://github.com/ondyari/FaceForensics)
is the most directly relevant option (it's what F3-Net itself was trained
on); the [DFDC (Deepfake Detection Challenge)](https://ai.meta.com/datasets/dfdc/)
dataset is another commonly used option. Both require accepting the dataset
owner's license/usage terms before download — follow their official
instructions rather than redistributing the data. Do not commit downloaded
media to this repo; place it under `datasets/raw/` locally, which is
gitignored.

# Dataset Info

This document describes the data behind the AI model DeepShield AI calls at
inference time. DeepShield AI does not train this model or own this
dataset — it consumes the model as a pretrained artifact from Hugging Face.
Fields we could not verify from the model's public documentation are marked
**Not publicly specified**.

## Model training dataset (used by the pretrained model)

| Field | Value |
|---|---|
| Dataset name | Deepfake and real face images (as referenced by the model author's Kaggle notebook) |
| Dataset source | Kaggle, via the notebook [`dima806/deepfake-vs-real-faces-detection-vit`](https://www.kaggle.com/code/dima806/deepfake-vs-real-faces-detection-vit) |
| Model card | [`dima806/deepfake_vs_real_image_detection`](https://huggingface.co/dima806/deepfake_vs_real_image_detection) on Hugging Face |
| Number of samples | Not publicly specified in the model card |
| Classes / categories | 2 — `Real`, `Fake` |
| Training data details | Not publicly specified (image count/split not disclosed by the author) |
| Testing data details | Not publicly specified |
| Validation data details | Not publicly specified |
| Base architecture | `google/vit-base-patch16-224-in21k` (Vision Transformer), fine-tuned for binary classification |
| Preprocessing steps | Handled internally by the Hugging Face `image-classification` pipeline's `AutoImageProcessor` (resize to 224×224, normalization) — DeepShield AI does not reimplement this |
| Known limitations | The model author's card notes the training data is several years old and warns of **concept drift**: modern AI-generated video is harder to detect than the deepfakes the model was originally trained on. DeepShield AI surfaces the model's raw confidence score rather than hiding this uncertainty. |

## Usage in DeepShield AI

DeepShield AI does not retrain or fine-tune this model. It is loaded once at
backend startup (`app/services/ai_model.py`) and used purely for inference:
video frames extracted by OpenCV are classified frame-by-frame, and the
per-frame `Fake` probabilities are averaged to produce the video-level
verdict, confidence, and risk level (`app/services/detection_service.py`).

## DeepShield AI's own test data (development QA, not a shipped dataset)

To validate the video pipeline end-to-end during development, short
synthetic clips were generated locally with OpenCV (random-noise frames with
a burned-in frame index) rather than using copyrighted or third-party
deepfake footage. These clips:

- Are **not** included in this repository.
- Are used only to confirm the pipeline (upload → frame extraction →
  inference → aggregation → API response) behaves correctly, not to
  benchmark detection accuracy.
- Can be regenerated with a few lines of OpenCV (`cv2.VideoWriter` +
  `numpy.random`) if you need a throwaway `.mp4` for local testing.

## Obtaining real evaluation data

If you want to evaluate detection accuracy rather than just pipeline
plumbing, you will need a labeled deepfake video dataset of your own — this
project does not bundle one. Commonly used public options include the
[FaceForensics++](https://github.com/ondyari/FaceForensics) dataset and the
[DFDC (Deepfake Detection Challenge)](https://ai.meta.com/datasets/dfdc/)
dataset. Both require accepting the dataset owner's license/usage terms
before download — follow their official instructions rather than
redistributing the data. Do not commit downloaded videos to this repo; place
them under `datasets/raw/` locally, which is gitignored.

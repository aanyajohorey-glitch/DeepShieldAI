"""Explainable AI: a visual attention heatmap, supplementary classical-CV
heuristics, and a plain-language explanation — all derived from real,
computed signals. Nothing here invents a manipulation category the model
doesn't actually output; where that distinction matters, the explanation
says so explicitly.
"""

import logging
import uuid
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image

from app.ai import model_loader
from app.core.config import settings

logger = logging.getLogger("deepshield.explainability")

# Face-presence used to be part of this heuristic set via cv2.CascadeClassifier
# (bundled Haar cascades), but OpenCV 5.x removed that API from the base
# `cv2` module — its replacement, FaceDetectorYN, requires downloading an
# external ONNX model at runtime. We deliberately skipped adding that
# network dependency for a supplementary signal; sharpness alone is
# self-contained and doesn't need a model file at all.


def compute_heuristics(frames: list[Image.Image]) -> dict[str, float | int]:
    """A supplementary, classical-CV signal computed independently of the
    ViT model's own score: sharpness (Laplacian variance), a standard proxy
    for unnatural smoothing sometimes introduced by generative manipulation.
    This is a well-known weak heuristic from the deepfake-forensics
    literature, not a claim about what the ViT model itself detected."""
    sharpness_values: list[float] = []

    for frame in frames:
        gray = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2GRAY)
        sharpness_values.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))

    avg_sharpness = sum(sharpness_values) / len(sharpness_values) if sharpness_values else 0.0
    min_sharpness = min(sharpness_values) if sharpness_values else 0.0

    return {
        "totalFramesAnalyzed": len(frames),
        "averageSharpness": round(avg_sharpness, 1),
        "minSharpness": round(min_sharpness, 1),
    }


def generate_attention_heatmap(frame: Image.Image) -> Image.Image | None:
    """Runs the ViT with `output_attentions=True` and performs attention
    rollout (Abnar & Zuidema, 2020) to visualize which regions of the frame
    most influenced the model's classification decision. This is a real,
    established XAI technique — not a fabricated visualization.

    Returns None rather than raising on any failure: the visual explanation
    is a bonus, and the core verdict must never depend on it succeeding.
    """
    try:
        model = model_loader.get_model()
        processor = model_loader.get_image_processor()
        device = next(model.parameters()).device

        inputs = processor(images=frame, return_tensors="pt").to(device)

        # The model runs on PyTorch's fused SDPA attention by default (faster
        # for normal inference), which never materializes per-head attention
        # weights — output_attentions is silently unsupported there. Switch
        # to the "eager" implementation just for this explainability pass,
        # then switch back so regular /analyze inference stays fast.
        original_impl = getattr(model.config, "_attn_implementation", "sdpa")
        model.set_attn_implementation("eager")
        try:
            with torch.no_grad():
                outputs = model(**inputs, output_attentions=True)
        finally:
            model.set_attn_implementation(original_impl)

        attentions = outputs.attentions
        if not attentions:
            logger.info("Model returned no attention weights; skipping heatmap.")
            return None

        seq_len = attentions[0].size(-1)
        rollout = torch.eye(seq_len, device=device)
        for layer_attn in attentions:
            heads_avg = layer_attn.mean(dim=1)[0]  # average over attention heads -> [seq_len, seq_len]
            heads_avg = heads_avg + torch.eye(seq_len, device=device)  # account for the residual connection
            heads_avg = heads_avg / heads_avg.sum(dim=-1, keepdim=True)
            rollout = heads_avg @ rollout

        cls_to_patches = rollout[0, 1:]  # the CLS token's rolled-out attention to each patch token
        grid_size = int(round(cls_to_patches.numel() ** 0.5))
        if grid_size * grid_size != cls_to_patches.numel():
            logger.info("Non-square patch grid (%d tokens); skipping heatmap.", cls_to_patches.numel())
            return None

        mask = cls_to_patches.reshape(grid_size, grid_size).cpu().numpy()
        mask = mask - mask.min()
        if mask.max() > 0:
            mask = mask / mask.max()

        mask_resized = cv2.resize(mask, frame.size, interpolation=cv2.INTER_CUBIC)
        heatmap = cv2.applyColorMap(np.uint8(255 * mask_resized), cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

        frame_arr = np.array(frame.convert("RGB"))
        overlay = cv2.addWeighted(frame_arr, 0.55, heatmap_rgb, 0.45, 0)
        return Image.fromarray(overlay)
    except Exception:
        logger.exception("Attention heatmap generation failed; continuing without it.")
        return None


def save_heatmap(image: Image.Image) -> str:
    """Saves the heatmap under the static directory and returns its
    filename (not a full path) for building a public URL."""
    static_dir = Path(settings.heatmap_dir)
    static_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.png"
    image.save(static_dir / filename, format="PNG")
    return filename


def build_explanation(
    prediction: str,
    confidence: float,
    risk_level: str,
    frames_processed: int,
    avg_frame_score: float,
    temporal_consistency: float,
    model_certainty: float,
    heuristics: dict[str, float | int],
) -> str:
    frame_word = "frame" if frames_processed == 1 else "frames"
    verdict_phrase = (
        "did not show strong signs of AI manipulation"
        if prediction == "REAL"
        else "showed signs consistent with AI-generated or manipulated content"
    )
    risk_phrase = {
        "Low": "minimal fake-signal was detected across the sampled frames.",
        "Medium": "some frames showed moderate fake-signal — a manual review is recommended.",
        "High": "a majority of sampled frames showed strong fake-signal.",
    }[risk_level]

    if temporal_consistency >= 80:
        consistency_phrase = "The model's assessment was highly consistent across frames."
    elif temporal_consistency < 50:
        consistency_phrase = (
            "The model's assessment varied noticeably between frames, which can indicate "
            "manipulation is only present in part of the clip, or that the result is less reliable."
        )
    else:
        consistency_phrase = "The model's assessment was moderately consistent across frames."

    if model_certainty >= 60:
        certainty_phrase = "well clear of the decision threshold"
    elif model_certainty < 30:
        certainty_phrase = "close to the decision threshold, so this result should be treated as borderline"
    else:
        certainty_phrase = "moderately clear of the decision threshold"

    avg_sharpness = heuristics.get("averageSharpness", 0)
    sharpness_phrase = (
        f"As a supplementary signal, sampled frames had an average sharpness score of "
        f"{avg_sharpness:.0f} (Laplacian variance) — unusually low values can indicate the "
        "smoothing some manipulation techniques introduce, though low sharpness alone is not "
        "conclusive (it can also simply reflect video quality)."
    )

    return (
        f"Analyzed {frames_processed} sampled {frame_word}. The average fake-likelihood "
        f"across those frames was {avg_frame_score:.1f}%, producing a {prediction} verdict "
        f"with {confidence:.1f}% confidence, {certainty_phrase}. The video {verdict_phrase}. "
        f"Risk level: {risk_level} — {risk_phrase} {consistency_phrase} {sharpness_phrase} "
        "Note: this score reflects overall visual authenticity as judged by a single "
        "image-classification model applied per frame — it does not separately identify the "
        "type of manipulation (e.g. face-swap vs. compression artifact)."
    )

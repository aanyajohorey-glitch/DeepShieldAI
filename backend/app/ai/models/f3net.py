"""F3-Net (Frequency in Face Forgery Network) — frequency-domain deepfake
detector, vendored from DeepfakeBench (SCLBD/DeepfakeBench,
training/detectors/f3net_detector.py — CC BY-NC 4.0, non-commercial use).

Only the parts needed for inference with a pretrained checkpoint are kept —
the original file also carries training/loss/metrics scaffolding tied to
DeepfakeBench's training framework, which this project doesn't use (no
training happens here, only loading DeepfakeBench's released `f3net_best.pth`
checkpoint and running forward passes).

The FAD_Head math (DCT-based frequency decomposition + learnable band-pass
filters) is copied verbatim — it's pure tensor math with no framework
dependency. `F3NetModel` below is a new, minimal wrapper replacing the
original `F3netDetector` class; it builds the Xception backbone with 12
input channels directly (matching the trained checkpoint's conv1 shape)
instead of replaying the original's build-time "start from ImageNet weights,
then surgically widen conv1 to 12 channels" initialization, which only
matters for training from scratch, not for loading an already-trained
checkpoint.
"""

import numpy as np
import torch
import torch.nn as nn

from .xception import Xception


class Filter(nn.Module):
    def __init__(self, size, band_start, band_end, use_learnable=True, norm=False):
        super().__init__()
        self.use_learnable = use_learnable
        self.base = nn.Parameter(torch.tensor(generate_filter(band_start, band_end, size)), requires_grad=False)
        if self.use_learnable:
            self.learnable = nn.Parameter(torch.randn(size, size), requires_grad=True)
            self.learnable.data.normal_(0.0, 0.1)
        self.norm = norm
        if norm:
            self.ft_num = nn.Parameter(torch.sum(torch.tensor(generate_filter(band_start, band_end, size))), requires_grad=False)

    def forward(self, x):
        if self.use_learnable:
            filt = self.base + norm_sigma(self.learnable)
        else:
            filt = self.base
        if self.norm:
            y = x * filt / self.ft_num
        else:
            y = x * filt
        return y


class FAD_Head(nn.Module):
    """Frequency-Aware Decomposition: DCT into frequency domain, split into
    low/mid/high/all learnable band-pass filters, inverse-DCT each band back
    to spatial domain, concatenate as extra channels (3 RGB -> 12)."""

    def __init__(self, size):
        super().__init__()
        self._DCT_all = nn.Parameter(torch.tensor(DCT_mat(size)).float(), requires_grad=False)
        self._DCT_all_T = nn.Parameter(torch.transpose(torch.tensor(DCT_mat(size)).float(), 0, 1), requires_grad=False)
        low_filter = Filter(size, 0, size // 2.82)
        middle_filter = Filter(size, size // 2.82, size // 2)
        high_filter = Filter(size, size // 2, size * 2)
        all_filter = Filter(size, 0, size * 2)
        self.filters = nn.ModuleList([low_filter, middle_filter, high_filter, all_filter])

    def forward(self, x):
        x_freq = self._DCT_all @ x @ self._DCT_all_T
        y_list = []
        for i in range(4):
            x_pass = self.filters[i](x_freq)
            y = self._DCT_all_T @ x_pass @ self._DCT_all
            y_list.append(y)
        return torch.cat(y_list, dim=1)


def DCT_mat(size):
    return [
        [(np.sqrt(1.0 / size) if i == 0 else np.sqrt(2.0 / size)) * np.cos((j + 0.5) * np.pi * i / size) for j in range(size)]
        for i in range(size)
    ]


def generate_filter(start, end, size):
    return [[0.0 if i + j > end or i + j < start else 1.0 for j in range(size)] for i in range(size)]


def norm_sigma(x):
    return 2.0 * torch.sigmoid(x) - 1.0


class F3NetModel(nn.Module):
    """Inference-only wrapper: FAD_Head -> Xception(inc=12) -> softmax.

    Attribute names (`backbone`, `FAD_head`) intentionally match the
    original DeepfakeBench `F3netDetector` so the released checkpoint's
    state_dict loads directly via `load_state_dict()`.
    """

    def __init__(self, resolution: int = 256, num_classes: int = 2, dropout: float = 0.5):
        super().__init__()
        backbone_config = {"num_classes": num_classes, "mode": "original", "inc": 12, "dropout": dropout}
        self.backbone = Xception(backbone_config)
        self.FAD_head = FAD_Head(resolution)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: (N, 3, H, W) normalized RGB face crops. Returns (N,) fake
        probability per image — index 1 of the softmax output, matching the
        label convention DeepfakeBench trained with (1 = fake, 0 = real)."""
        fea_fad = self.FAD_head(x)
        features = self.backbone.features(fea_fad)
        logits = self.backbone.classifier(features)
        probs = torch.softmax(logits, dim=1)
        return probs[:, 1]

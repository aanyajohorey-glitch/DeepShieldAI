"""Branded PDF report template for a single detection result. Kept separate
from the detection business logic so the report layout can evolve (or gain
alternate templates) without touching the pipeline that produces the data.
"""

import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.db.models.detection import Detection

_DARK = colors.HexColor("#0b1220")
_MUTED = colors.HexColor("#4b5570")
_BORDER = colors.HexColor("#e2e8f0")
_SUCCESS = colors.HexColor("#059669")
_DANGER = colors.HexColor("#dc2626")


def _styles():
    base = getSampleStyleSheet()
    base.add(ParagraphStyle(name="DSTitle", fontSize=22, leading=26, textColor=_DARK, fontName="Helvetica-Bold"))
    base.add(ParagraphStyle(name="DSSubtitle", fontSize=10, textColor=_MUTED, spaceAfter=4))
    base.add(
        ParagraphStyle(
            name="DSSectionHeading",
            fontSize=13,
            textColor=_DARK,
            spaceBefore=14,
            spaceAfter=6,
            fontName="Helvetica-Bold",
        )
    )
    base.add(ParagraphStyle(name="DSBody", fontSize=10, leading=15, textColor=_DARK))
    base.add(ParagraphStyle(name="DSVerdict", fontSize=20, leading=24, fontName="Helvetica-Bold"))
    base.add(ParagraphStyle(name="DSDisclaimer", fontSize=8, leading=11, textColor=_MUTED))
    return base


def _meta_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[45 * mm, 120 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), _MUTED),
                ("TEXTCOLOR", (1, 0), (1, -1), _DARK),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def generate_detection_pdf(detection: Detection) -> bytes:
    """Renders a single detection result as a branded, professional PDF and
    returns the raw PDF bytes."""
    buffer = io.BytesIO()
    styles = _styles()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        title=f"DeepShield AI Report DS-{detection.id:06d}",
    )

    is_real = detection.prediction == "REAL"
    verdict_color = _SUCCESS if is_real else _DANGER
    verdict_label = "AUTHENTIC" if is_real else "DEEPFAKE DETECTED"

    story = []

    story.append(Paragraph("DeepShield AI", styles["DSTitle"]))
    story.append(Paragraph("AI-Powered Deepfake Detection Report", styles["DSSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_BORDER))
    story.append(Spacer(1, 8 * mm))

    generated_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    story.append(
        _meta_table(
            [
                ["Report ID", f"DS-{detection.id:06d}"],
                ["Generated", generated_at],
                ["Scan Timestamp", detection.created_at.strftime("%B %d, %Y at %H:%M UTC")],
                ["File Analyzed", detection.filename],
            ]
        )
    )
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Detection Verdict", styles["DSSectionHeading"]))
    verdict_style = ParagraphStyle(name="VerdictColored", parent=styles["DSVerdict"], textColor=verdict_color)
    story.append(Paragraph(verdict_label, verdict_style))
    story.append(Spacer(1, 4 * mm))

    stats_table = Table(
        [
            ["Confidence", f"{detection.confidence:.1f}%", "Risk Level", detection.risk_level],
            [
                "Model Certainty",
                f"{detection.model_certainty:.1f}%",
                "Temporal Consistency",
                f"{detection.temporal_consistency:.1f}%",
            ],
            ["Frames Analyzed", str(detection.frames_processed), "Processing Time", f"{detection.processing_time:.2f}s"],
        ],
        colWidths=[35 * mm, 35 * mm, 40 * mm, 40 * mm],
    )
    stats_table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), _MUTED),
                ("TEXTCOLOR", (2, 0), (2, -1), _MUTED),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
                ("FONTNAME", (3, 0), (3, -1), "Helvetica-Bold"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, _BORDER),
                ("BOX", (0, 0), (-1, -1), 0.5, _BORDER),
            ]
        )
    )
    story.append(stats_table)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Analysis Summary", styles["DSSectionHeading"]))
    story.append(Paragraph(detection.explanation, styles["DSBody"]))
    story.append(Spacer(1, 6 * mm))

    if detection.heuristics:
        heuristics = detection.heuristics
        lines = []
        if "averageSharpness" in heuristics:
            lines.append(
                f"Average frame sharpness (Laplacian variance): {heuristics.get('averageSharpness', 0):.1f} "
                f"across {heuristics.get('totalFramesAnalyzed', 0)} sampled frames."
            )
        if lines:
            story.append(Paragraph("Supplementary Signals", styles["DSSectionHeading"]))
            story.append(Paragraph(" ".join(lines), styles["DSBody"]))
            story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("File Information", styles["DSSectionHeading"]))
    file_rows = [["Filename", detection.filename]]
    if detection.file_size_bytes:
        file_rows.append(["File Size", f"{detection.file_size_bytes / (1024 * 1024):.2f} MB"])
    if detection.video_width and detection.video_height:
        file_rows.append(["Resolution", f"{detection.video_width} x {detection.video_height}"])
    if detection.video_duration_seconds:
        file_rows.append(["Duration", f"{detection.video_duration_seconds:.1f}s"])
    if detection.video_fps:
        file_rows.append(["Frame Rate", f"{detection.video_fps:.1f} fps"])
    if detection.video_codec:
        file_rows.append(["Codec", detection.video_codec])
    file_rows.append(["Model Used", detection.model_used])
    story.append(_meta_table(file_rows))
    story.append(Spacer(1, 10 * mm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=_BORDER))
    story.append(Spacer(1, 4 * mm))
    disclaimer = (
        "This report was generated automatically by DeepShield AI using a pretrained AI model "
        "applied to sampled video frames. It reflects an automated assessment of visual "
        "authenticity and should be reviewed alongside other evidence before being used for "
        "high-stakes decisions. DeepShield AI is a research/educational capstone project and "
        "does not constitute a forensic certification."
    )
    story.append(Paragraph(disclaimer, styles["DSDisclaimer"]))

    doc.build(story)
    return buffer.getvalue()

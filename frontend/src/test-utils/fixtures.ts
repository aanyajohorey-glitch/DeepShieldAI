import type { DetectionResult } from "@/types";

export function makeDetectionResult(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    id: 42,
    filename: "sample.mp4",
    fileType: "video",
    prediction: "REAL",
    confidence: 87.3,
    riskLevel: "Low",
    avgFrameScore: 12.7,
    explanation: "Analyzed 5 frames. Average fake-likelihood was 12.7%.",
    framesProcessed: 5,
    processingTime: 1.42,
    modelUsed: "dima806/deepfake_vs_real_image_detection",
    createdAt: "2026-07-28T12:00:00Z",
    frameScores: [10, 12, 15, 11, 16],
    temporalConsistency: 92.4,
    modelCertainty: 74.6,
    heuristics: { totalFramesAnalyzed: 5, averageSharpness: 320.5, minSharpness: 280.1 },
    heatmapUrl: null,
    metadata: {
      width: 1280,
      height: 720,
      durationSeconds: 5.0,
      fps: 30,
      frameCount: 150,
      codec: "avc1",
      fileSizeBytes: 2_500_000,
    },
    ...overrides,
  };
}

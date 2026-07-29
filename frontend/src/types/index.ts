export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export type ThreatLevel = "low" | "guarded" | "elevated" | "critical";

export type EngineStatus = "operational" | "degraded" | "offline";

export type ScanVerdict = "authentic" | "deepfake";

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: "scan" | "auth" | "alert" | "system";
  tone: "cyan" | "purple" | "success" | "warning" | "danger";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  tone: "info" | "success" | "warning" | "danger";
}

export interface StatCardData {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  icon: string;
  tone: "cyan" | "purple" | "success" | "danger";
}

export interface ApiError {
  detail: string;
}

export type DetectionPrediction = "REAL" | "DEEPFAKE";

export type DetectionRiskLevel = "Low" | "Medium" | "High";

export interface VideoMetadata {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  fps: number | null;
  frameCount: number | null;
  codec: string | null;
  fileSizeBytes: number | null;
}

export interface DetectionHeuristics {
  totalFramesAnalyzed?: number;
  averageSharpness?: number;
  minSharpness?: number;
  [key: string]: number | undefined;
}

export interface DetectionResult {
  id: number;
  filename: string;
  prediction: DetectionPrediction;
  confidence: number;
  riskLevel: DetectionRiskLevel;
  avgFrameScore: number;
  explanation: string;
  framesProcessed: number;
  processingTime: number;
  modelUsed: string;
  createdAt: string;
  // Explainable AI (Phase 4)
  frameScores: number[];
  temporalConsistency: number;
  modelCertainty: number;
  heuristics: DetectionHeuristics;
  heatmapUrl: string | null;
  // File / video metadata (Phase 4)
  metadata: VideoMetadata;
}

export interface DetectionHistoryResponse {
  total: number;
  items: DetectionResult[];
}

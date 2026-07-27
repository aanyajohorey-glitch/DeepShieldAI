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

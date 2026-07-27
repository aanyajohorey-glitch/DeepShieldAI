import { FileVideo, ShieldCheck, ShieldAlert, Gauge } from "lucide-react";
import type { ActivityItem, NotificationItem, StatCardData } from "@/types";

export const STAT_CARDS: StatCardData[] = [
  {
    label: "Total Videos Scanned",
    value: "0",
    delta: "No scans yet",
    trend: "flat",
    icon: "video",
    tone: "cyan",
  },
  {
    label: "Authentic Videos",
    value: "0",
    delta: "Awaiting first scan",
    trend: "flat",
    icon: "shield-check",
    tone: "success",
  },
  {
    label: "Deepfake Videos",
    value: "0",
    delta: "Awaiting first scan",
    trend: "flat",
    icon: "shield-alert",
    tone: "danger",
  },
  {
    label: "Current Threat Level",
    value: "Low",
    delta: "System nominal",
    trend: "flat",
    icon: "gauge",
    tone: "cyan",
  },
];

export const STAT_ICONS = {
  video: FileVideo,
  "shield-check": ShieldCheck,
  "shield-alert": ShieldAlert,
  gauge: Gauge,
} as const;

export function activitySeed(): ActivityItem[] {
  const now = Date.now();
  return [
    {
      id: "a1",
      title: "Account created",
      description: "Your DeepShield AI workspace was provisioned successfully.",
      timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
      icon: "auth",
      tone: "success",
    },
    {
      id: "a2",
      title: "AI detection engine initialized",
      description: "Pre-trained models loaded and placed on standby.",
      timestamp: new Date(now - 1000 * 60 * 4).toISOString(),
      icon: "system",
      tone: "cyan",
    },
    {
      id: "a3",
      title: "Signed in",
      description: "New session started from a recognized device.",
      timestamp: new Date(now - 1000 * 60 * 2).toISOString(),
      icon: "auth",
      tone: "cyan",
    },
  ];
}

export const NOTIFICATION_SEED: NotificationItem[] = [
  {
    id: "n1",
    title: "Welcome to DeepShield AI",
    message: "Explore the dashboard while detection features roll out in upcoming phases.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    tone: "success",
  },
  {
    id: "n2",
    title: "AI engine on standby",
    message: "Detection models are loaded and ready for the next phase.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
    tone: "info",
  },
];

export const WEEKLY_SCAN_VOLUME = [
  { day: "Mon", scans: 0 },
  { day: "Tue", scans: 0 },
  { day: "Wed", scans: 0 },
  { day: "Thu", scans: 0 },
  { day: "Fri", scans: 0 },
  { day: "Sat", scans: 0 },
  { day: "Sun", scans: 0 },
];

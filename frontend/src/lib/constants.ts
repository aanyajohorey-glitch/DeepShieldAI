import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ScanFace,
  History,
  BarChart3,
  Bot,
  ClipboardList,
  Settings,
  UserRound,
  ShieldCheck,
} from "lucide-react";

export const APP_NAME = "DeepShield AI";
export const APP_DESCRIPTION =
  "AI-powered deepfake detection and cybersecurity intelligence platform.";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/** Backend origin without the `/api` suffix — for static assets like heatmap images. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const AUTH_COOKIE_NAME = "ds_token";

export const GITHUB_URL = "https://github.com/aanyajohorey-glitch/DeepShieldAI";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Detection", href: "/detection", icon: ScanFace },
  { label: "History", href: "/history", icon: History },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "AI Assistant", href: "/assistant", icon: Bot },
  { label: "Survey", href: "/survey", icon: ClipboardList },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export const PROTECTED_PATHS = [
  "/dashboard",
  "/detection",
  "/history",
  "/analytics",
  "/assistant",
  "/survey",
  "/settings",
  "/profile",
];

export const BRAND_ICON = ShieldCheck;

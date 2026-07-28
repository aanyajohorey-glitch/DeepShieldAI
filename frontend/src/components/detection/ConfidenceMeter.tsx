"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number;
  tone: "success" | "danger";
  size?: number;
  label?: string;
}

const toneStroke: Record<ConfidenceMeterProps["tone"], string> = {
  success: "var(--success)",
  danger: "var(--danger)",
};

export function ConfidenceMeter({ value, tone, size = 176, label = "Confidence" }: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneStroke[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-mono text-4xl font-bold tracking-tight",
            tone === "success" ? "text-success" : "text-danger"
          )}
        >
          {clamped.toFixed(1)}%
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

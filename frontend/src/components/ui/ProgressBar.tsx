"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  tone?: "cyan" | "purple" | "success" | "warning" | "danger";
  label?: string;
  showValue?: boolean;
}

const toneMap: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  cyan: "from-cyan-strong to-cyan",
  purple: "from-purple-strong to-purple",
  success: "from-success to-cyan",
  warning: "from-warning to-danger",
  danger: "from-danger to-warning",
};

export function ProgressBar({
  value,
  className,
  tone = "cyan",
  label,
  showValue = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono text-foreground">{clamped}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", toneMap[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

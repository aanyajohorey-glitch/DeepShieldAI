"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import type { DetectionResult } from "@/types";

const riskTone: Record<DetectionResult["riskLevel"], "success" | "warning" | "danger"> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
};

export function VerdictCard({ result }: { result: DetectionResult }) {
  const isReal = result.prediction === "REAL";
  const tone = isReal ? "success" : "danger";
  const Icon = isReal ? ShieldCheck : ShieldAlert;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass-card relative overflow-hidden px-6 py-10 text-center",
        isReal ? "border-success/30" : "border-danger/30"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-24 left-1/2 h-64 w-[420px] -translate-x-1/2 rounded-full blur-[100px]",
          isReal ? "bg-success/20" : "bg-danger/20"
        )}
        aria-hidden="true"
      />

      <div className="relative">
        <span
          className={cn(
            "mx-auto flex size-20 items-center justify-center rounded-3xl",
            isReal ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          <Icon className="size-10" strokeWidth={1.5} />
        </span>

        <p className="mt-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Detection Verdict
        </p>
        <h1 className={cn("mt-2 text-4xl font-bold tracking-tight sm:text-5xl", isReal ? "text-success" : "text-danger")}>
          {isReal ? "Authentic" : "Deepfake Detected"}
        </h1>

        <p className="mx-auto mt-3 max-w-md truncate text-sm text-muted">{result.filename}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <StatusBadge tone={riskTone[result.riskLevel]}>{result.riskLevel} Risk</StatusBadge>
          <StatusBadge tone={tone} dot={false}>
            {result.prediction}
          </StatusBadge>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DETECTION_STAGES } from "@/lib/detection-constants";

const ESTIMATED_FRAME_CEILING = 30;

export function ScanningScreen() {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, DETECTION_STAGES.length - 1));
    }, 1800);

    // Asymptotically approaches ~92% while the real request is in flight;
    // the parent swaps this screen out for the result once the response lands.
    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 92 ? prev : prev + (92 - prev) * 0.08));
    }, 200);

    const frameTimer = setInterval(() => {
      setFrameCount((prev) => (prev >= ESTIMATED_FRAME_CEILING ? prev : prev + 1));
    }, 220);

    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
      clearInterval(frameTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center gap-8 px-6 py-16 text-center"
    >
      <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background-elevated">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:14px_14px]" />
        <div className="absolute inset-x-0 h-14 bg-gradient-to-b from-cyan/30 via-cyan/5 to-transparent animate-scan" />
        <ScanFace className="relative size-11 text-cyan" strokeWidth={1.5} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground">Analyzing Video...</h2>
        <div className="mt-2 h-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-cyan"
            >
              {DETECTION_STAGES[stageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <ProgressBar value={progress} tone="cyan" />
      </div>

      <p className="font-mono text-sm text-muted-foreground">
        Frame {frameCount} of ~{ESTIMATED_FRAME_CEILING} analyzed
      </p>
    </motion.div>
  );
}

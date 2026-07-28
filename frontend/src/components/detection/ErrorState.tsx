"use client";

import { motion } from "framer-motion";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center gap-5 border-danger/30 px-6 py-16 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert className="size-8" strokeWidth={1.5} />
      </span>

      <div>
        <h2 className="text-xl font-semibold text-foreground">Analysis Failed</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      </div>

      <Button onClick={onRetry} variant="secondary">
        <RotateCcw className="size-4" />
        Try Again
      </Button>
    </motion.div>
  );
}

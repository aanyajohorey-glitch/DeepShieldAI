"use client";

import { motion } from "framer-motion";
import { FileVideo, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes } from "./UploadDropzone";

interface UploadProgressProps {
  file: File;
  percent: number;
  onCancel: () => void;
}

export function UploadProgress({ file, percent, onCancel }: UploadProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center gap-6 px-6 py-12 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-strong/20 to-purple-strong/20 text-cyan">
        <FileVideo className="size-8" strokeWidth={1.5} />
      </span>

      <div className="min-w-0">
        <p className="max-w-md truncate text-base font-semibold text-foreground">{file.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatBytes(file.size)}</p>
      </div>

      <div className="w-full max-w-sm">
        <ProgressBar value={percent} tone="cyan" label="Uploading..." showValue />
      </div>

      <Button onClick={onCancel} variant="outline">
        <X className="size-4" />
        Cancel Upload
      </Button>
    </motion.div>
  );
}

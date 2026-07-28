"use client";

import { motion } from "framer-motion";
import { FileVideo, ScanSearch, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBytes } from "./UploadDropzone";

interface SelectedFilePreviewProps {
  file: File;
  onAnalyze: () => void;
  onClear: () => void;
}

export function SelectedFilePreview({ file, onAnalyze, onClear }: SelectedFilePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center gap-5 px-6 py-12 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-strong/20 to-purple-strong/20 text-cyan">
        <FileVideo className="size-8" strokeWidth={1.5} />
      </span>

      <div className="min-w-0">
        <p className="max-w-md truncate text-base font-semibold text-foreground">{file.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatBytes(file.size)}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onAnalyze} size="lg">
          <ScanSearch className="size-4" />
          Analyze Video
        </Button>
        <Button onClick={onClear} variant="outline" size="lg">
          <X className="size-4" />
          Choose Different File
        </Button>
      </div>
    </motion.div>
  );
}

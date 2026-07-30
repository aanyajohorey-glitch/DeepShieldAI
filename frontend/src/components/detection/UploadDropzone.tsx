"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Files, TriangleAlert, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DETECTION_ACCEPT_ATTRIBUTE,
  DETECTION_ACCEPTED_EXTENSIONS,
  DETECTION_MAX_SIZE_BYTES,
  DETECTION_MAX_SIZE_MB,
} from "@/lib/detection-constants";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

function validateFile(file: File): string | null {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!DETECTION_ACCEPTED_EXTENSIONS.includes(extension)) {
    return `Unsupported file format "${extension}". Supported formats: ${DETECTION_ACCEPTED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size > DETECTION_MAX_SIZE_BYTES) {
    return `File exceeds the maximum allowed size of ${DETECTION_MAX_SIZE_MB}MB.`;
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({ onFileSelected }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-6 py-20 text-center transition-colors",
          isDragging
            ? "border-cyan bg-cyan/5"
            : "border-border bg-surface hover:border-cyan/50 hover:bg-surface-hover"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={DETECTION_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <span
          className={cn(
            "flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-strong/20 to-purple-strong/20 text-cyan transition-transform duration-300",
            isDragging ? "scale-110" : "group-hover:scale-105"
          )}
        >
          <UploadCloud className="size-9" strokeWidth={1.5} />
        </span>

        <div>
          <p className="text-lg font-semibold text-foreground">
            Drag &amp; drop a video or image, or{" "}
            <span className="text-cyan underline underline-offset-4">browse files</span>
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted">
            <Files className="size-4" />
            {DETECTION_ACCEPTED_EXTENSIONS.map((ext) => ext.replace(".", "").toUpperCase()).join(
              " · "
            )}{" "}
            — up to {DETECTION_MAX_SIZE_MB}MB
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}

export { formatBytes, validateFile };

"use client";

import { useCallback, useRef, useState } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/detection/UploadDropzone";
import { SelectedFilePreview } from "@/components/detection/SelectedFilePreview";
import { UploadProgress } from "@/components/detection/UploadProgress";
import { ScanningScreen } from "@/components/detection/ScanningScreen";
import { VerdictCard } from "@/components/detection/VerdictCard";
import { ConfidenceMeter } from "@/components/detection/ConfidenceMeter";
import { ResultMetaGrid } from "@/components/detection/ResultMetaGrid";
import { ErrorState } from "@/components/detection/ErrorState";
import { uploadVideo, ApiRequestError } from "@/lib/api";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import type { DetectionResult } from "@/types";

type Phase = "select" | "uploading" | "processing" | "result" | "error";

export default function DetectionPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    setPhase("select");
    setSelectedFile(null);
    setUploadPercent(0);
    setResult(null);
    setErrorMessage(null);
  }, []);

  const startAnalysis = useCallback((file: File) => {
    const token = Cookies.get(AUTH_COOKIE_NAME);
    if (!token) {
      setErrorMessage("Your session has expired. Please sign in again.");
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setUploadPercent(0);
    cancelledRef.current = false;

    const handle = uploadVideo(file, token, (percent) => {
      setUploadPercent(percent);
      if (percent >= 100) setPhase("processing");
    });
    abortRef.current = handle.abort;

    handle.promise
      .then((data) => {
        setResult(data);
        setPhase("result");
      })
      .catch((error) => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          setPhase("select");
          return;
        }
        const message =
          error instanceof ApiRequestError
            ? error.message
            : "Something went wrong while analyzing your video. Please try again.";
        setErrorMessage(message);
        setPhase("error");
      });
  }, []);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Deepfake Detection</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a video to analyze it with DeepShield AI&apos;s pre-trained detection model.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "select" && !selectedFile && (
          <motion.div key="dropzone" exit={{ opacity: 0 }}>
            <UploadDropzone onFileSelected={setSelectedFile} />
          </motion.div>
        )}

        {phase === "select" && selectedFile && (
          <motion.div key="preview" exit={{ opacity: 0 }}>
            <SelectedFilePreview
              file={selectedFile}
              onAnalyze={() => startAnalysis(selectedFile)}
              onClear={() => setSelectedFile(null)}
            />
          </motion.div>
        )}

        {phase === "uploading" && selectedFile && (
          <motion.div key="uploading" exit={{ opacity: 0 }}>
            <UploadProgress file={selectedFile} percent={uploadPercent} onCancel={handleCancel} />
          </motion.div>
        )}

        {phase === "processing" && (
          <motion.div key="processing" exit={{ opacity: 0 }}>
            <ScanningScreen />
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div key="result" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <VerdictCard result={result} />
              <div className="glass-card flex items-center justify-center p-8">
                <ConfidenceMeter
                  value={result.confidence}
                  tone={result.prediction === "REAL" ? "success" : "danger"}
                />
              </div>
            </div>

            <ResultMetaGrid result={result} />

            <div className="flex justify-center">
              <Button onClick={reset} variant="secondary" size="lg">
                <RotateCcw className="size-4" />
                Scan Another Video
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" exit={{ opacity: 0 }}>
            <ErrorState message={errorMessage ?? "An unexpected error occurred."} onRetry={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

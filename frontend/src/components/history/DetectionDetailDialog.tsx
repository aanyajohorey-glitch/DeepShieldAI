"use client";

import { Download } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { VerdictCard } from "@/components/detection/VerdictCard";
import { ConfidenceMeter } from "@/components/detection/ConfidenceMeter";
import { AnalysisSummary } from "@/components/detection/AnalysisSummary";
import { ResultMetaGrid } from "@/components/detection/ResultMetaGrid";
import { downloadReport } from "@/lib/report";
import type { DetectionResult } from "@/types";

interface DetectionDetailDialogProps {
  result: DetectionResult | null;
  onClose: () => void;
}

export function DetectionDetailDialog({ result, onClose }: DetectionDetailDialogProps) {
  return (
    <Dialog
      open={result !== null}
      onClose={onClose}
      title="Scan Details"
      className="max-w-2xl scrollbar-thin max-h-[85vh] overflow-y-auto"
    >
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <VerdictCard result={result} />
            <div className="glass-card flex items-center justify-center p-8">
              <ConfidenceMeter
                value={result.confidence}
                tone={result.prediction === "REAL" ? "success" : "danger"}
              />
            </div>
          </div>

          <AnalysisSummary result={result} />
          <ResultMetaGrid result={result} />

          <div className="flex justify-center">
            <Button onClick={() => downloadReport(result)} variant="outline">
              <Download className="size-4" />
              Download Report
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

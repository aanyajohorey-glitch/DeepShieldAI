"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { Download, FileText } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { VerdictCard } from "@/components/detection/VerdictCard";
import { ConfidenceMeter } from "@/components/detection/ConfidenceMeter";
import { ConfidenceMetricsPanel } from "@/components/detection/ConfidenceMetricsPanel";
import { AttentionHeatmap } from "@/components/detection/AttentionHeatmap";
import { AnalysisSummary } from "@/components/detection/AnalysisSummary";
import { ResultMetaGrid } from "@/components/detection/ResultMetaGrid";
import { downloadReport } from "@/lib/report";
import { downloadPdfReport, ApiRequestError } from "@/lib/api";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { useToast } from "@/hooks/useToast";
import type { DetectionResult } from "@/types";

const FrameScoreChart = dynamic(
  () => import("@/components/detection/FrameScoreChart").then((m) => m.FrameScoreChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface DetectionDetailDialogProps {
  result: DetectionResult | null;
  onClose: () => void;
}

export function DetectionDetailDialog({ result, onClose }: DetectionDetailDialogProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const { toast } = useToast();

  async function handlePdfDownload() {
    if (!result) return;
    const token = Cookies.get(AUTH_COOKIE_NAME);
    if (!token) return;

    setIsDownloadingPdf(true);
    try {
      await downloadPdfReport(token, result.id);
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : "Failed to generate the PDF report.";
      toast({ title: "PDF download failed", description: message, variant: "error" });
    } finally {
      setIsDownloadingPdf(false);
    }
  }

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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FrameScoreChart result={result} />
            <ConfidenceMetricsPanel result={result} />
          </div>

          <AttentionHeatmap heatmapUrl={result.heatmapUrl} />

          <ResultMetaGrid result={result} />

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => downloadReport(result)} variant="outline">
              <Download className="size-4" />
              Download Text Report
            </Button>
            <Button onClick={handlePdfDownload} variant="outline" isLoading={isDownloadingPdf}>
              <FileText className="size-4" />
              Download PDF Report
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

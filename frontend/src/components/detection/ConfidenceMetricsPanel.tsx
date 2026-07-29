import { Activity, Target } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { DetectionResult } from "@/types";

export function ConfidenceMetricsPanel({ result }: { result: DetectionResult }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Model Certainty &amp; Consistency</CardTitle>
          <CardDescription>How reliable this specific result is, beyond the headline confidence</CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <Target className="size-3.5" />
              Model Certainty
            </span>
            <span className="font-mono text-foreground">{result.modelCertainty.toFixed(1)}%</span>
          </div>
          <ProgressBar value={result.modelCertainty} tone={result.modelCertainty >= 60 ? "success" : result.modelCertainty < 30 ? "danger" : "warning"} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Distance from the decision threshold — higher means the score is not borderline.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <Activity className="size-3.5" />
              Temporal Consistency
            </span>
            <span className="font-mono text-foreground">{result.temporalConsistency.toFixed(1)}%</span>
          </div>
          <ProgressBar
            value={result.temporalConsistency}
            tone={result.temporalConsistency >= 80 ? "success" : result.temporalConsistency < 50 ? "danger" : "warning"}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            How much sampled frames agreed with each other — lower can mean partial manipulation.
          </p>
        </div>
      </div>
    </Card>
  );
}

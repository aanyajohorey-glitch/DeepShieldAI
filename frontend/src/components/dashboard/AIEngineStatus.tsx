import { Cpu, Zap } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const models = [
  { name: "Deepfake Video Classifier", version: "v1.0", readiness: 100 },
  { name: "Facial Artifact Analyzer", version: "v1.0", readiness: 100 },
  { name: "Temporal Consistency Model", version: "v1.0", readiness: 100 },
];

export function AIEngineStatus() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>AI Engine Status</CardTitle>
          <CardDescription>Pre-trained detection models</CardDescription>
        </div>
        <StatusBadge tone="success" pulse>
          Operational
        </StatusBadge>
      </CardHeader>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-strong/20 to-purple-strong/20 text-cyan">
          <Cpu className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Inference cluster</p>
          <p className="text-xs text-muted">Standing by for the Detection module</p>
        </div>
        <Zap className="size-4 shrink-0 text-warning" />
      </div>

      <div className="mt-5 space-y-4">
        {models.map((model) => (
          <div key={model.name}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-foreground">{model.name}</span>
              <span className="font-mono text-muted-foreground">{model.version}</span>
            </div>
            <ProgressBar value={model.readiness} tone="success" />
          </div>
        ))}
      </div>
    </Card>
  );
}

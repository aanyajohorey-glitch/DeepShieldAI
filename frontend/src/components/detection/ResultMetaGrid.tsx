import { Cpu, Layers, Clock, Gauge, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { DetectionResult } from "@/types";

export function ResultMetaGrid({ result }: { result: DetectionResult }) {
  const items = [
    {
      icon: Layers,
      label: "Frames Analyzed",
      value: String(result.framesProcessed),
    },
    {
      icon: Clock,
      label: "Processing Time",
      value: `${result.processingTime.toFixed(2)}s`,
    },
    {
      icon: Gauge,
      label: "Average Frame Score",
      value: `${result.avgFrameScore.toFixed(1)}%`,
    },
    {
      icon: Cpu,
      label: "Model Used",
      value: result.modelUsed,
    },
    {
      icon: CalendarClock,
      label: "Detection Timestamp",
      value: formatDate(result.createdAt),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, label, value }) => (
        <Card key={label} className="flex items-center gap-3.5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-cyan">
            <Icon className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-sm font-semibold text-foreground" title={value}>
              {value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

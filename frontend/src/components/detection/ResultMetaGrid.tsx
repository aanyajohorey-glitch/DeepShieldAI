import { Cpu, Layers, Clock, Gauge, CalendarClock, Film, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { DetectionResult } from "@/types";

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResultMetaGrid({ result }: { result: DetectionResult }) {
  const { metadata } = result;

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
    ...(metadata.width && metadata.height
      ? [{ icon: Film, label: "Resolution", value: `${metadata.width} × ${metadata.height}` }]
      : []),
    ...(metadata.durationSeconds
      ? [{ icon: Clock, label: "Duration", value: `${metadata.durationSeconds.toFixed(1)}s` }]
      : []),
    ...(metadata.fps ? [{ icon: Gauge, label: "Frame Rate", value: `${metadata.fps.toFixed(1)} fps` }] : []),
    ...(metadata.codec ? [{ icon: Film, label: "Codec", value: metadata.codec }] : []),
    ...(formatFileSize(metadata.fileSizeBytes)
      ? [{ icon: HardDrive, label: "File Size", value: formatFileSize(metadata.fileSizeBytes) as string }]
      : []),
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

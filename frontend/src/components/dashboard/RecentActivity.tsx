import { KeyRound, ShieldCheck, AlertTriangle, Cpu } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn, formatRelativeTime } from "@/lib/utils";
import { activitySeed } from "./data";
import type { ActivityItem } from "@/types";

const iconMap: Record<ActivityItem["icon"], typeof ShieldCheck> = {
  scan: ShieldCheck,
  auth: KeyRound,
  alert: AlertTriangle,
  system: Cpu,
};

const toneMap: Record<ActivityItem["tone"], string> = {
  cyan: "text-cyan bg-cyan/10",
  purple: "text-purple bg-purple/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
};

export function RecentActivity() {
  const activity = activitySeed();

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest account and system events</CardDescription>
        </div>
      </CardHeader>

      <ol className="space-y-5">
        {activity.map((item, index) => {
          const Icon = iconMap[item.icon];
          return (
            <li key={item.id} className="relative flex gap-3.5">
              {index !== activity.length - 1 && (
                <span className="absolute left-[15px] top-9 h-[calc(100%-4px)] w-px bg-border" />
              )}
              <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", toneMap[item.tone])}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

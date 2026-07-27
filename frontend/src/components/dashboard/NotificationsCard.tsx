import { Info, ShieldCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRelativeTime, cn } from "@/lib/utils";
import { NOTIFICATION_SEED } from "./data";
import type { NotificationItem } from "@/types";

const toneIcon: Record<NotificationItem["tone"], typeof Info> = {
  success: ShieldCheck,
  info: Info,
  warning: Info,
  danger: Info,
};

const toneClass: Record<NotificationItem["tone"], string> = {
  success: "text-success bg-success/10",
  info: "text-info bg-info/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
};

export function NotificationsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>System and account updates</CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {NOTIFICATION_SEED.map((item) => {
          const Icon = toneIcon[item.tone];
          return (
            <div
              key={item.id}
              className={cn(
                "flex gap-3 rounded-xl border border-border px-4 py-3",
                !item.read ? "bg-cyan/[0.04]" : "bg-surface"
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneClass[item.tone])}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

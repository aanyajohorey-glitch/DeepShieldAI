import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  icon: LucideIcon;
  tone: "cyan" | "purple" | "success" | "danger";
}

const toneClasses: Record<StatCardProps["tone"], string> = {
  cyan: "from-cyan-strong/25 to-cyan/5 text-cyan",
  purple: "from-purple-strong/25 to-purple/5 text-purple",
  success: "from-success/25 to-success/5 text-success",
  danger: "from-danger/25 to-danger/5 text-danger",
};

const trendConfig = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-danger" },
  flat: { icon: Minus, className: "text-muted-foreground" },
};

export function StatCard({ label, value, delta, trend, icon: Icon, tone }: StatCardProps) {
  const Trend = trendConfig[trend].icon;

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br",
            toneClasses[tone]
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-5 font-mono text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", trendConfig[trend].className)}>
        <Trend className="size-3.5" />
        <span>{delta}</span>
      </div>
    </div>
  );
}

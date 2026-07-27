"use client";

import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/dashboard/StatCard";
import { ScanActivityChart } from "@/components/dashboard/ScanActivityChart";
import { AIEngineStatus } from "@/components/dashboard/AIEngineStatus";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickUploadCard } from "@/components/dashboard/QuickUploadCard";
import { RecentScansCard } from "@/components/dashboard/RecentScansCard";
import { NotificationsCard } from "@/components/dashboard/NotificationsCard";
import { STAT_CARDS, STAT_ICONS } from "@/components/dashboard/data";

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s the current state of your DeepShield AI workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            trend={stat.trend}
            tone={stat.tone}
            icon={STAT_ICONS[stat.icon as keyof typeof STAT_ICONS]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScanActivityChart />
        </div>
        <AIEngineStatus />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <div className="lg:col-span-2 xl:col-span-2">
          <RecentActivity />
        </div>
        <QuickUploadCard />
        <RecentScansCard />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <NotificationsCard />
      </div>
    </div>
  );
}

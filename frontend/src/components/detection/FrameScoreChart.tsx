"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DetectionResult } from "@/types";

export function FrameScoreChart({ result }: { result: DetectionResult }) {
  const data = result.frameScores.map((score, index) => ({
    frame: `${index + 1}`,
    score,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Per-Frame Analysis</CardTitle>
          <CardDescription>Fake-likelihood score for each sampled frame</CardDescription>
        </div>
      </CardHeader>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="frame"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              label={{ value: "Sampled frame", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              width={32}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <ReferenceLine y={50} stroke="var(--border-strong)" strokeDasharray="4 4" />
            <Tooltip
              cursor={{ fill: "var(--surface-hover)" }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Fake-likelihood"]}
              labelFormatter={(label) => `Frame ${label}`}
              contentStyle={{
                background: "var(--surface-solid)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                fontSize: "0.75rem",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.score >= 50 ? "var(--danger)" : "var(--success)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Dashed line marks the 50% decision threshold — bars above it push toward a DEEPFAKE verdict.
      </p>
    </Card>
  );
}

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

const stack = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "Tailwind CSS v4",
  "Framer Motion",
  "FastAPI",
  "SQLite",
  "Recharts",
];

export function AboutSettings() {
  return (
    <Card id="about">
      <CardHeader>
        <div>
          <CardTitle>About {APP_NAME}</CardTitle>
          <CardDescription>{APP_DESCRIPTION}</CardDescription>
        </div>
        <StatusBadge tone="cyan">v0.1.0 — Phase 1</StatusBadge>
      </CardHeader>

      <div className="flex flex-wrap gap-2">
        {stack.map((item) => (
          <span
            key={item}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted"
          >
            {item}
          </span>
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        DeepShield AI is being developed in phases. This release establishes the
        platform foundation — authentication, dashboard, and design system —
        that future phases will build AI-powered deepfake detection on top of.
      </p>
    </Card>
  );
}

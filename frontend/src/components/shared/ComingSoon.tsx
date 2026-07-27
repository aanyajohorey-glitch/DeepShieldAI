import type { LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  capabilities: string[];
}

export function ComingSoon({ icon: Icon, title, description, capabilities }: ComingSoonProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <div
          className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-cyan/30 to-purple/30 blur-2xl"
          aria-hidden="true"
        />
        <span className="flex size-20 items-center justify-center rounded-3xl border border-border bg-surface">
          <Icon className="size-9 text-cyan" strokeWidth={1.5} />
        </span>
      </div>

      <StatusBadge tone="purple" pulse className="mb-4">
        Coming in a future phase
      </StatusBadge>

      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{description}</p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {capabilities.map((capability) => (
          <div
            key={capability}
            className="glass-card flex items-center gap-2.5 px-4 py-3 text-left text-sm text-muted"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan to-purple" />
            {capability}
          </div>
        ))}
      </div>
    </div>
  );
}

import { CheckCircle2, Gauge, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const reasons = [
  "Built on pre-trained, research-grade AI detection models — no training pipeline required",
  "Enterprise-inspired dashboard modeled after tools like Microsoft Defender and CrowdStrike",
  "Modular architecture designed to extend cleanly across future development phases",
  "Session-based authentication keeps every scan and report tied to a verified account",
];

const metrics = [
  { icon: Gauge, label: "Designed for real-time analysis", value: "< 1s UI response" },
  { icon: LayoutDashboard, label: "Unified security workspace", value: "8 modules" },
  { icon: ShieldCheck, label: "Modern authentication", value: "Session protected" },
];

export function WhyDeepShield() {
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-purple/[0.06] to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-purple">
              Why DeepShield AI
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A commercial-grade experience, built for learning and impact
            </h2>
            <p className="mt-4 text-lg text-muted">
              DeepShield AI blends a premium security-operations interface with
              practical, achievable engineering — the same architecture patterns
              used in production-grade platforms.
            </p>

            <ul className="mt-8 space-y-4">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cyan" />
                  <span className="text-sm leading-relaxed text-foreground/90">{reason}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass-card p-8">
              <div className="grid grid-cols-1 gap-5">
                {metrics.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-strong/20 to-purple-strong/20 text-cyan">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-sm text-muted">{label}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

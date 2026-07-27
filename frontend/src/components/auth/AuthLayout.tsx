import { ShieldCheck, Cpu, Lock, Activity } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { StatusBadge } from "@/components/ui/StatusBadge";

const highlights = [
  { icon: Cpu, label: "Pre-trained AI detection models" },
  { icon: Activity, label: "Real-time authenticity scoring" },
  { icon: Lock, label: "Secure, session-based access" },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-background-elevated p-12 lg:flex">
        <div
          className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-cyan/20 blur-[130px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple/20 blur-[130px]"
          aria-hidden="true"
        />

        <Logo className="relative" />

        <div className="relative space-y-8">
          <StatusBadge tone="cyan" pulse>
            <ShieldCheck className="mr-1 size-3" />
            AI-Powered Threat Detection
          </StatusBadge>
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-foreground">
            Your command center for detecting synthetic media threats.
          </h2>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-muted">
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-cyan">
                  <Icon className="size-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} DeepShield AI. Built for educational and research purposes.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

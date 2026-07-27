import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  href?: string;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ href = "/", className, iconOnly = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5 select-none", className)}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-strong to-purple-strong shadow-[0_0_20px_-4px_var(--accent-cyan)] transition-transform duration-200 group-hover:scale-105">
        <ShieldCheck className="size-5 text-white" strokeWidth={2.25} />
      </span>
      {!iconOnly && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}

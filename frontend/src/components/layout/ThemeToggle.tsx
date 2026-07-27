"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle color theme"
      className={cn(
        "relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-foreground hover:bg-surface-hover cursor-pointer",
        className
      )}
    >
      {mounted && (
        <>
          {isDark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </>
      )}
    </button>
  );
}

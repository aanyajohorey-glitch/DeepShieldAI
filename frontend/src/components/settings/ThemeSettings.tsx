"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const options = [
  { value: "dark", label: "Dark", description: "Low-light optimized cyber theme", icon: Moon },
  { value: "light", label: "Light", description: "Bright, high-contrast workspace", icon: Sun },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Card id="theme">
      <CardHeader>
        <div>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Choose how DeepShield AI looks on this device</CardDescription>
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map(({ value, label, description, icon: Icon }) => {
          const isActive = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer",
                isActive
                  ? "border-cyan/60 bg-cyan/5 ring-1 ring-cyan/30"
                  : "border-border bg-surface hover:border-border-strong"
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  isActive ? "bg-gradient-to-br from-cyan-strong to-purple-strong text-white" : "bg-surface-hover text-muted"
                )}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-muted">{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

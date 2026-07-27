"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ShieldCheck, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import type { NotificationItem } from "@/types";

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Welcome to DeepShield AI",
    message: "Your account and workspace have been provisioned successfully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    tone: "success",
  },
  {
    id: "n2",
    title: "AI engine models loaded",
    message: "Detection models initialized and are on standby for future scans.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
    tone: "info",
  },
  {
    id: "n3",
    title: "Security tip",
    message: "Enable two-factor verification from Settings → Security for extra protection.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    tone: "warning",
  },
];

const toneIcon: Record<NotificationItem["tone"], typeof Bell> = {
  success: ShieldCheck,
  info: Info,
  warning: Sparkles,
  danger: Bell,
};

const toneClass: Record<NotificationItem["tone"], string> = {
  success: "text-success bg-success/10",
  info: "text-info bg-info/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
};

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false), open);

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-foreground hover:bg-surface-hover cursor-pointer"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger ring-2 ring-background-elevated" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="glass-card absolute right-0 top-12 z-50 w-80 origin-top-right bg-surface-solid p-0"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-xs text-cyan">{unreadCount} new</span>
              )}
            </div>
            <div className="scrollbar-thin max-h-80 overflow-y-auto">
              {NOTIFICATIONS.map((item) => {
                const Icon = toneIcon[item.tone];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex gap-3 border-b border-border px-4 py-3 last:border-b-0",
                      !item.read && "bg-cyan/[0.03]"
                    )}
                  >
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneClass[item.tone])}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

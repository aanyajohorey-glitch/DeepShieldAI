"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  useOnClickOutside(ref, () => setOpen(false), open);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-2.5 text-sm transition-colors hover:bg-surface-hover cursor-pointer"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-strong to-purple-strong text-[11px] font-semibold text-white">
          {getInitials(user.name)}
        </span>
        <span className="hidden max-w-28 truncate font-medium text-foreground sm:inline">
          {user.name}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="glass-card absolute right-0 top-12 z-50 w-56 origin-top-right bg-surface-solid p-1.5"
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="py-1.5">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <UserRound className="size-4" /> Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <Settings className="size-4" /> Settings
              </Link>
            </div>
            <div className="border-t border-border pt-1.5">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10 cursor-pointer"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

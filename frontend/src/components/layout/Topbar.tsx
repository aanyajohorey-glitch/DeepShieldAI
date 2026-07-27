"use client";

import { Menu, Search } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";

export function Topbar({ title }: { title?: string }) {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-foreground md:hidden cursor-pointer"
        aria-label="Open navigation"
      >
        <Menu className="size-[18px]" />
      </button>

      {title && (
        <h1 className="hidden text-lg font-semibold tracking-tight text-foreground sm:block">
          {title}
        </h1>
      )}

      <div className="relative ml-auto hidden max-w-sm flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search DeepShield AI..."
          className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan/50 focus:outline-none focus:ring-2 focus:ring-cyan/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5 md:ml-0">
        <ThemeToggle />
        <NotificationsMenu />
        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}

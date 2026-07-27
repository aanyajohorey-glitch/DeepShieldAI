"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft, LogOut } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/constants";
import { useSidebar } from "./SidebarContext";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-gradient-to-r from-cyan/15 to-purple/10 text-foreground"
          : "text-muted hover:bg-surface hover:text-foreground"
      )}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-cyan to-purple"
          transition={{ duration: 0.2 }}
        />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          isActive ? "text-cyan" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { isMobileOpen, setMobileOpen, isCollapsed, toggleCollapsed } = useSidebar();
  const { user, logout } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: isCollapsed ? 84 : 268 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-background-elevated/95 backdrop-blur-xl transition-transform duration-300 md:sticky md:top-0 md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center border-b border-border px-4", isCollapsed && "justify-center px-0")}>
          <Logo iconOnly={isCollapsed} />
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Platform
              </p>
            )}
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.href} {...item} collapsed={isCollapsed} onNavigate={closeMobile} />
            ))}
          </div>

          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </p>
            )}
            {SECONDARY_NAV.map((item) => (
              <NavLink key={item.href} {...item} collapsed={isCollapsed} onNavigate={closeMobile} />
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          {user && (
            <div
              className={cn(
                "mb-2 flex items-center gap-3 rounded-xl px-2 py-2",
                isCollapsed && "justify-center px-0"
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-strong to-purple-strong text-xs font-semibold text-white">
                {getInitials(user.name)}
              </span>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={logout}
            title="Logout"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
          <button
            onClick={toggleCollapsed}
            className="mt-1 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground cursor-pointer md:flex"
          >
            <ChevronsLeft className={cn("size-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

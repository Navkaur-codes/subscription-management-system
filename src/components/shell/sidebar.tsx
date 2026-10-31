"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";
import type { Role, SessionPayload } from "@/lib/session";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { logoutAction } from "@/app/(auth)/actions";
import { NAV } from "./nav";
import { Logo } from "./logo";

const KEY = "bl-sidebar-collapsed";

export function Sidebar({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1");
    } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  return (
    <aside
      className={cn(
        "no-print sticky top-0 hidden h-svh shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex dark:border-r dark:border-sidebar-border",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <SidebarGlow />
      <div className={cn("relative flex h-16 items-center", collapsed ? "justify-center" : "justify-between px-5")}>
        <Link href="/dashboard" aria-label="Brightloop home">
          <Logo withText={!collapsed} textClassName="text-white" />
        </Link>
        {!collapsed && (
          <button
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          onClick={toggle}
          aria-label="Expand sidebar"
          className="relative mx-auto mb-2 rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
        >
          <ChevronsLeft className="size-4 rotate-180" />
        </button>
      )}
      <SidebarNav role={user.role} pathname={pathname} collapsed={collapsed} />
      <SidebarUser user={user} collapsed={collapsed} />
    </aside>
  );
}

/** Faint violet glow at the top of the ink sidebar. */
export function SidebarGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(120%_70%_at_30%_0%,rgb(124_58_237/0.28),transparent_70%)]"
    />
  );
}

export function SidebarNav({
  role,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className={cn("scrollbar-thin relative flex-1 space-y-6 overflow-y-auto py-3", collapsed ? "px-3" : "px-3.5")}>
      {NAV.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.label}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            ) : (
              <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold tracking-[0.12em] text-sidebar-muted/80 uppercase">{g.label}</p>
            )}
            <ul className="space-y-0.5">
              {items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                const link = (
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-lg text-[13.5px] text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white",
                      collapsed ? "justify-center" : "px-2.5",
                      active && "bg-white/[0.08] font-medium text-white"
                    )}
                  >
                    {active && (
                      <span className="absolute top-1.5 bottom-1.5 -left-3.5 w-[3px] rounded-r-full bg-brand-gradient shadow-[0_0_12px_rgb(124_58_237/0.9)]" />
                    )}
                    <i.icon className={cn("size-[18px] shrink-0", active ? "text-[#a78bfa]" : "text-sidebar-muted group-hover:text-white")} />
                    {!collapsed && <span className="truncate">{i.label}</span>}
                  </Link>
                );
                return (
                  <li key={i.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{i.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarUser({ user, collapsed = false }: { user: SessionPayload; collapsed?: boolean }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="relative border-t border-sidebar-border p-3">
      <div className={cn("flex items-center gap-3 rounded-xl p-2", !collapsed && "bg-white/[0.04] ring-1 ring-white/[0.06]")}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
          {initials}
        </span>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-sidebar-muted">{humanize(user.role)}</p>
            </div>
            <button
              onClick={() => void logoutAction()}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

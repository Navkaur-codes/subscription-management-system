"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";
import type { Role, SessionPayload } from "@/lib/session";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FlipIndicator } from "@/components/motion";
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
        "no-print sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "justify-between pr-3 pl-5")}>
        <Link href="/dashboard" aria-label="Brightloop home" className="text-sidebar-foreground">
          <Logo animated withText={!collapsed} />
        </Link>
        {!collapsed && <CollapseButton onClick={toggle} label="Collapse sidebar" />}
      </div>
      {collapsed && <CollapseButton onClick={toggle} label="Expand sidebar" className="mx-auto mb-2" flipped />}
      <SidebarNav role={user.role} pathname={pathname} collapsed={collapsed} layoutId="nav-desktop" />
      <SidebarUser user={user} collapsed={collapsed} />
    </aside>
  );
}

function CollapseButton({ onClick, label, className, flipped }: { onClick: () => void; label: string; className?: string; flipped?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn("rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground", className)}
    >
      <ChevronsLeft className={cn("size-4", flipped && "rotate-180")} />
    </button>
  );
}

export function SidebarNav({
  role,
  pathname,
  onNavigate,
  collapsed = false,
  layoutId = "nav-mobile",
}: {
  role: Role;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  layoutId?: string;
}) {
  return (
    <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-3">
      {NAV.map((g, gi) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.label}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            ) : (
              <p className="mb-2 flex items-center gap-2 px-2.5 font-mono-num text-[10px] tracking-[0.16em] text-sidebar-muted/80 uppercase">
                <span className="text-sidebar-muted/50">{String(gi + 1).padStart(2, "0")}</span>
                {g.label}
              </p>
            )}
            <ul className="space-y-px">
              {items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                const link = (
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-lg text-[13.5px] text-sidebar-muted transition-colors hover:text-sidebar-foreground",
                      collapsed ? "justify-center" : "px-2.5",
                      active && "text-sidebar-foreground"
                    )}
                  >
                    {active && (
                      <FlipIndicator
                        layoutId={layoutId}
                        className={cn(
                          "absolute inset-0 rounded-lg bg-sidebar-accent ring-1 ring-sidebar-border ring-inset",
                          "after:absolute after:top-1/2 after:size-1.5 after:-translate-y-1/2 after:rounded-full after:bg-ember",
                          collapsed ? "after:right-1.5" : "after:right-3"
                        )}
                      />
                    )}
                    <i.icon className="relative size-[17px] shrink-0" strokeWidth={1.75} />
                    {!collapsed && <span className="relative truncate">{i.label}</span>}
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

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function SidebarUser({ user, collapsed = false }: { user: SessionPayload; collapsed?: boolean }) {
  return (
    <div className="border-t border-sidebar-border p-3">
      <div className={cn("flex items-center gap-3 p-1.5", collapsed && "justify-center")}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper font-mono-num text-[11px] font-semibold text-ink">
          {initials(user.name)}
        </span>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{user.name}</p>
              <p className="truncate font-mono-num text-[10.5px] tracking-wider text-sidebar-muted uppercase">{humanize(user.role)}</p>
            </div>
            <button
              onClick={() => void logoutAction()}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-ember"
            >
              <LogOut className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

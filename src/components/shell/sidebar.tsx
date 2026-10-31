"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/session";
import { NAV } from "./nav";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <aside className="no-print sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5 text-sm font-semibold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">B</span>
        Brightloop
      </div>
      <SidebarNav role={role} pathname={pathname} />
    </aside>
  );
}

export function SidebarNav({ role, pathname, onNavigate }: { role: Role; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV.map((g) => {
        const items = g.items.filter((i) => i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.label}>
            <p className="mb-1 px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{g.label}</p>
            <ul className="space-y-0.5">
              {items.map((i) => {
                const active = pathname === i.href || pathname.startsWith(i.href + "/");
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                        active && "bg-sidebar-accent font-medium text-foreground"
                      )}
                    >
                      <i.icon className={cn("size-4", active && "text-brand")} />
                      {i.label}
                    </Link>
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

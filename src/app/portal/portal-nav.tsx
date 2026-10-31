"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FlipIndicator } from "@/components/motion";
import { PORTAL_NAV } from "@/components/shell/nav";

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="flex h-full min-w-0 items-stretch gap-1 overflow-x-auto [scrollbar-width:none]">
      {PORTAL_NAV.map((i) => {
        const active = i.href === "/portal" ? pathname === "/portal" : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center px-3 text-sm whitespace-nowrap text-sidebar-muted transition-colors hover:text-sidebar-foreground",
              active && "text-sidebar-foreground"
            )}
          >
            {i.label}
            {active && <FlipIndicator layoutId="portal-nav" className="absolute inset-x-3 bottom-0 h-0.5 bg-ember" />}
          </Link>
        );
      })}
    </nav>
  );
}

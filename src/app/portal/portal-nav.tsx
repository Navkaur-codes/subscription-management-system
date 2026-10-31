"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PORTAL_NAV } from "@/components/shell/nav";

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {PORTAL_NAV.map((i) => {
        const active = i.href === "/portal" ? pathname === "/portal" : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white",
              active && "bg-white/[0.09] font-medium text-white"
            )}
          >
            {i.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-t-full bg-brand-gradient shadow-[0_0_12px_rgb(124_58_237/0.9)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

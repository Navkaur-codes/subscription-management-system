"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PORTAL_NAV } from "@/components/shell/nav";

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {PORTAL_NAV.map((i) => {
        const active = i.href === "/portal" ? pathname === "/portal" : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-muted font-medium text-foreground"
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

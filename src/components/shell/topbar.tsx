"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/(auth)/actions";
import { humanize } from "@/lib/format";
import type { SessionPayload } from "@/lib/session";
import { SidebarNav } from "./sidebar";
import { NAV } from "./nav";

function currentTitle(pathname: string) {
  for (const g of NAV) for (const i of g.items) if (pathname.startsWith(i.href)) return { group: g.label, label: i.label, href: i.href };
  return null;
}

export function UserMenu({ user }: { user: SessionPayload }) {
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-8 items-center justify-center rounded-full border bg-muted text-xs font-semibold">{initials}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">{humanize(user.role)}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Call the action directly: a <form> inside the menu unmounts before it can submit. */}
        <DropdownMenuItem onSelect={() => void logoutAction()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = currentTitle(pathname);
  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="flex h-14 items-center border-b px-5 text-sm">Brightloop</SheetTitle>
          <SidebarNav role={user.role} pathname={pathname} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {t && (
          <>
            <span>{t.group}</span>
            <span>/</span>
            <Link href={t.href} className="font-medium text-foreground">
              {t.label}
            </Link>
          </>
        )}
      </nav>
      <div className="ml-auto">
        <UserMenu user={user} />
      </div>
    </header>
  );
}

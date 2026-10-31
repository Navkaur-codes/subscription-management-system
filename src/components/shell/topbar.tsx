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
import { SidebarNav, SidebarUser, initials } from "./sidebar";
import { NAV } from "./nav";
import { Logo } from "./logo";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme-toggle";

function currentTitle(pathname: string) {
  for (const g of NAV) for (const i of g.items) if (pathname.startsWith(i.href)) return { group: g.label, label: i.label, href: i.href };
  return null;
}

export function UserMenu({ user }: { user: SessionPayload }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary font-mono-num text-[11px] font-semibold text-primary-foreground ring-2 ring-transparent transition-shadow hover:ring-ember">
            {initials(user.name)}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-lg">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono-num text-[10.5px] tracking-wider text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-ember" />
            {humanize(user.role)}
          </span>
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
  const deeper = t && pathname !== t.href;
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-canvas px-4 sm:px-6 lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="-ml-1 md:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 border-0 bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="flex h-16 items-center px-5 text-sidebar-foreground">
            <Logo animated />
          </SheetTitle>
          <SidebarNav role={user.role} pathname={pathname} onNavigate={() => setOpen(false)} />
          <SidebarUser user={user} />
        </SheetContent>
      </Sheet>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 font-mono-num text-[11px] tracking-[0.12em] text-muted-foreground uppercase lg:flex">
        {t && (
          <>
            <span>{t.group}</span>
            <span className="text-border">/</span>
            <Link href={t.href} className={deeper ? "hover:text-foreground" : "text-foreground"}>
              {t.label}
            </Link>
            {deeper && (
              <>
                <span className="text-border">/</span>
                <span className="text-foreground">Details</span>
              </>
            )}
          </>
        )}
      </nav>
      <div className="flex min-w-0 flex-1 justify-end lg:justify-center">
        <CommandPalette role={user.role} />
      </div>
      <div className="flex items-center gap-1.5 lg:min-w-40 lg:justify-end">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

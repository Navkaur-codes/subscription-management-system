import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { FadeIn } from "@/components/motion";
import { UserMenu } from "@/components/shell/topbar";
import { Logo } from "@/components/shell/logo";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { PortalNav } from "./portal-nav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CUSTOMER");
  return (
    <div className="min-h-svh bg-canvas">
      <header className="no-print sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
          <Link href="/portal" aria-label="Brightloop portal" className="shrink-0">
            <Logo animated withText={false} className="sm:hidden" />
            <Logo animated className="hidden sm:inline-flex" />
          </Link>
          <PortalNav />
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="mr-2 hidden font-mono-num text-[10.5px] tracking-[0.16em] text-sidebar-muted uppercase md:inline">
              Customer portal
            </span>
            <ThemeToggle className="hidden text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground sm:inline-flex dark:hover:bg-sidebar-accent" />
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <FadeIn>{children}</FadeIn>
      </main>
    </div>
  );
}

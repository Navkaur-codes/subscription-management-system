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
      <header className="no-print sticky top-0 z-30 overflow-hidden bg-sidebar text-sidebar-foreground shadow-[0_1px_0_var(--sidebar-border)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_140%_at_15%_0%,rgb(124_58_237/0.35),transparent_70%)]"
        />
        <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
          <Link href="/portal" aria-label="Brightloop portal" className="shrink-0">
            <Logo className="sm:hidden" withText={false} />
            <Logo className="hidden sm:inline-flex" textClassName="text-white" />
          </Link>
          <PortalNav />
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ThemeToggle className="hidden text-sidebar-muted sm:inline-flex hover:bg-sidebar-accent hover:text-white dark:hover:bg-sidebar-accent" />
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

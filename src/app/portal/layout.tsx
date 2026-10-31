import { requireRole } from "@/lib/auth";
import { FadeIn } from "@/components/motion";
import { UserMenu } from "@/components/shell/topbar";
import { PortalNav } from "./portal-nav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CUSTOMER");
  return (
    <div className="min-h-svh">
      <header className="no-print sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">B</span>
            <span className="hidden sm:inline">Brightloop</span>
          </div>
          <PortalNav />
          <div className="ml-auto shrink-0">
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <FadeIn>{children}</FadeIn>
      </main>
    </div>
  );
}

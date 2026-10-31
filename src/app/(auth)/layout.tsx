import Link from "next/link";
import { AuthPanel } from "./auth-panel";
import { LoopScene } from "./loop-scene";

/** Orbit mark: the loop with one ember payment on it. */
function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="16" cy="5" r="4.2" fill="#ff5b1f" stroke="var(--canvas)" strokeWidth="2" />
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh bg-canvas lg:grid-cols-[minmax(440px,0.85fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col">
        {/* Mobile: a slim ink band with the loop, so phones get the brand moment too */}
        <div className="relative h-56 overflow-hidden bg-sidebar lg:hidden">
          <div className="absolute inset-x-0 -top-6 bottom-0 opacity-90">
            <LoopScene compact />
          </div>
          <p className="font-display absolute bottom-5 left-6 text-3xl text-paper">
            Revenue that <em className="text-ember">comes back</em>.
          </p>
        </div>

        <div className="flex items-center justify-between px-6 pt-8 sm:px-12">
          <Link href="/login" aria-label="Brightloop" className="flex items-center gap-2.5 text-foreground">
            <Mark className="size-7" />
            <span className="text-[17px] font-semibold tracking-tight">Brightloop</span>
          </Link>
          <span className="font-mono-num text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Billing OS</span>
        </div>

        <div className="flex flex-1 items-center px-6 py-12 sm:px-12 xl:px-20">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-5 font-mono-num text-[11px] tracking-wide text-muted-foreground sm:px-12">
          <span>© 2026 Brightloop Software</span>
          <span>Encrypted sessions · GST-ready invoices</span>
        </div>
      </div>

      <div className="sticky top-0 hidden h-svh min-w-0 lg:block">
        <AuthPanel />
      </div>
    </div>
  );
}

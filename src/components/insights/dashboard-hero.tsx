import type { ReactNode } from "react";
import { RevealText } from "@/components/motion";

/** Ink hero card (dark in both themes), shared by the dashboard and the portal. `orbit` and `ticker` slots take motion primitives. */
export function DashboardHero({
  eyebrow,
  headline,
  sub,
  actions,
  orbit,
  ticker,
}: {
  eyebrow: string;
  headline: ReactNode;
  sub: ReactNode;
  actions?: ReactNode;
  orbit?: ReactNode;
  ticker?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-ink text-paper">
      <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="font-mono-num text-[11px] tracking-[0.18em] text-paper/60 uppercase">{eyebrow}</p>
          <RevealText as="h1" className="font-display mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl [&_em]:text-ember">
            {headline}
          </RevealText>
          <p className="mt-4 max-w-xl text-sm text-paper/70">{sub}</p>
          {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {orbit && <div className="hidden justify-center lg:flex">{orbit}</div>}
      </div>
      {ticker && <div className="border-t border-paper/10 py-3 text-paper/70">{ticker}</div>}
    </section>
  );
}

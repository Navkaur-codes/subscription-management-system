"use client";
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/components/motion/gsap";
import { LoopScene } from "./loop-scene";

/** Illustrative events for the marketing ticker (the real app shows live data on the dashboard). */
const EVENTS = [
  ["INV/2026/12931", "paid", "₹31,947", "UPI"],
  ["SUB/2026/05012", "activated", "Starter Monthly", "12 seats"],
  ["SEATS10", "applied", "−₹5,775", "10% off"],
  ["INV/2026/12930", "sent", "Kiran Traders", "due 30 Nov"],
  ["Billing run", "complete", "41 invoices", "₹18.2 L"],
  ["INV/2026/12902", "paid", "₹1,20,060", "Bank transfer"],
  ["SUB/2026/04987", "renewed", "Business Yearly", "+1 year"],
] as const;

// Film-grain texture so the ink panel feels printed rather than flat.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export function AuthPanel() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const q = gsap.utils.selector(root);
      if (reduced) return;

      SplitText.create(q("[data-headline]"), {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, { yPercent: 110, duration: 1.1, stagger: 0.09, ease: "expo.out", delay: 0.5 }),
      });
      gsap.from(q("[data-fade]"), { opacity: 0, y: 10, duration: 0.9, stagger: 0.1, ease: "power3.out", delay: 0.9 });

      // Seamless marquee: the track holds the events twice, slide it by half its width forever.
      const track = q("[data-track]")[0];
      const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
      track.addEventListener("mouseenter", () => loop.timeScale(0.2));
      track.addEventListener("mouseleave", () => loop.timeScale(1));
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen" style={{ backgroundImage: GRAIN }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgb(243_239_230/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(243_239_230/0.035)_1px,transparent_1px)] [background-size:72px_72px]"
      />

      <div data-fade className="relative flex items-center justify-between px-12 pt-10 font-mono-num text-[11px] tracking-[0.18em] text-sidebar-muted uppercase">
        <span>Recurring revenue, in one loop</span>
        <span className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-ember" />
          </span>
          Live
        </span>
      </div>

      <div className="relative min-h-0 flex-1 px-6">
        <LoopScene />
      </div>

      <div className="relative px-12 pb-8">
        <h2 data-headline className="font-display max-w-xl text-[54px] leading-[1.02] text-paper">
          Revenue that <em className="text-ember">comes back</em>, every single cycle.
        </h2>
        <p data-fade className="mt-4 max-w-md text-[15px] leading-relaxed text-sidebar-muted">
          Plans, subscriptions, invoices and payments for Brightloop Software — billed on time, matched to the right
          bill, and reported the moment it happens.
        </p>
      </div>

      <div className="relative min-w-0 overflow-hidden border-t border-sidebar-border py-4">
        <div data-track className="flex w-max gap-10 whitespace-nowrap">
          {[...EVENTS, ...EVENTS].map(([id, verb, a, b], i) => (
            <span key={i} className="flex items-center gap-3 font-mono-num text-[12.5px] text-sidebar-muted">
              <span className="size-1.5 rounded-full bg-ember" />
              <span className="text-paper">{id}</span>
              <span>{verb}</span>
              <span className="text-paper/80">{a}</span>
              <span className="text-sidebar-muted/70">· {b}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

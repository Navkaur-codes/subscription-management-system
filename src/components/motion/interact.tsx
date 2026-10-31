"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Flip, gsap, reduced, useGSAP } from "./gsap";

/** Seamless horizontal marquee. `speed` in px/s; pauses on hover; static under reduced motion. */
export function Ticker({ items, speed = 40, className }: { items: ReactNode[]; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = track.current;
      if (!el || reduced()) return;
      const half = el.scrollWidth / 2;
      const tween = gsap.to(el, { x: -half, duration: half / speed, ease: "none", repeat: -1 });
      const root = ref.current!;
      const pause = () => gsap.to(tween, { timeScale: 0, duration: 0.4 });
      const play = () => gsap.to(tween, { timeScale: 1, duration: 0.4 });
      root.addEventListener("mouseenter", pause);
      root.addEventListener("mouseleave", play);
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tween.play() : tween.pause()));
      io.observe(root);
      return () => {
        root.removeEventListener("mouseenter", pause);
        root.removeEventListener("mouseleave", play);
        io.disconnect();
      };
    },
    { scope: ref, dependencies: [items.length, speed] }
  );
  const row = items.map((it, i) => (
    <span key={i} className="flex shrink-0 items-center gap-3 pr-10">
      <span className="size-1.5 rounded-full bg-ember" aria-hidden />
      {it}
    </span>
  ));
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className
      )}
    >
      <div ref={track} className="flex w-max whitespace-nowrap">
        {row}
        <span aria-hidden className="contents">
          {row}
        </span>
      </div>
    </div>
  );
}

/** Wrap a primary CTA: it leans toward the cursor while hovered. Mouse pointers only. */
export function Magnetic({ children, strength = 0.3, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced() || !window.matchMedia("(pointer: fine)").matches) return;
      const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * strength);
        y((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      };
    },
    { scope: ref }
  );
  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}

/**
 * Draws SVG strokes in once they appear (charts render after measuring, so we wait a few frames).
 * `selector` picks the strokes; `fade` picks fills that fade in behind them.
 */
export function DrawIn({
  children,
  selector = ".recharts-area-curve, .recharts-line-curve",
  fade = ".recharts-area-area",
  className,
}: {
  children: ReactNode;
  selector?: string;
  fade?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced()) return;
      let frame = 0;
      let raf = 0;
      const tryDraw = () => {
        const strokes = root.querySelectorAll(selector);
        if (!strokes.length && frame++ < 60) {
          raf = requestAnimationFrame(tryDraw);
          return;
        }
        gsap.fromTo(strokes, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.2, ease: "power2.inOut", stagger: 0.1 });
        gsap.from(root.querySelectorAll(fade), { opacity: 0, duration: 0.8, delay: 0.5, ease: "power1.out" });
      };
      raf = requestAnimationFrame(tryDraw);
      return () => cancelAnimationFrame(raf);
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const flipStates = new Map<string, Flip.FlipState>();

/**
 * Active-item indicator that glides between items. Render it ONLY inside the active item, with the same
 * `layoutId` for the whole group (use different ids for groups that coexist, e.g. desktop vs mobile nav).
 */
export function FlipIndicator({ layoutId, className }: { layoutId: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = flipStates.get(layoutId);
    flipStates.delete(layoutId);
    if (prev && !reduced()) Flip.from(prev, { targets: el, duration: 0.45, ease: "power3.inOut", scale: true });
    return () => {
      flipStates.set(layoutId, Flip.getState(el));
    };
  }, [layoutId]);
  return <span ref={ref} data-flip-id={layoutId} aria-hidden className={cn("pointer-events-none", className)} />;
}

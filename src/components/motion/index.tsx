"use client";
/**
 * GSAP motion primitives. Rules: transform/opacity only, ≤400ms, runs once on mount,
 * skipped under prefers-reduced-motion. Use these — don't import gsap in pages.
 */
import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fade + 8px rise for a block (page body, card, auth form). */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      gsap.from(ref.current, { opacity: 0, y: 8, duration: 0.35, delay, ease: "power2.out" });
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Staggers direct children matching `selector` (default: [data-stagger]).
 * Only the first `max` items animate so long tables stay cheap.
 */
export function Stagger({
  children,
  selector = "[data-stagger]",
  max = 12,
  className,
}: {
  children: ReactNode;
  selector?: string;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced() || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll(selector)).slice(0, max);
      if (items.length)
        gsap.from(items, { opacity: 0, y: 6, duration: 0.3, stagger: 0.03, ease: "power2.out" });
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Counts a number up from 0 (KPI cards). `format` renders the value. */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (!ref.current) return;
      if (reduced()) {
        ref.current.textContent = format(value);
        return;
      }
      const obj = { n: 0 };
      gsap.to(obj, {
        n: value,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) ref.current.textContent = format(obj.n);
        },
      });
    },
    { dependencies: [value], scope: ref }
  );
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

/** Slow, gentle vertical float for decorative cards (auth hero). Pauses under reduced motion. */
export function Float({
  children,
  amplitude = 10,
  duration = 4,
  delay = 0,
  className,
}: {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      gsap.from(ref.current, { opacity: 0, y: 24, duration: 0.6, delay, ease: "power3.out" });
      gsap.to(ref.current, {
        y: -amplitude,
        duration,
        delay: delay + 0.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Brief scale pulse when `trigger` changes (e.g. status badge after a transition). */
export function Pulse({ trigger, children }: { trigger: unknown; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      gsap.fromTo(ref.current, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    },
    { dependencies: [trigger], scope: ref }
  );
  return (
    <span ref={ref} className="inline-flex">
      {children}
    </span>
  );
}

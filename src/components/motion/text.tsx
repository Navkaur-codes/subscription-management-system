"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, reduced, SplitText, useGSAP } from "./gsap";

/** Headline that slides up line-by-line (or word-by-word) from a mask. Supports <em> inside. */
export function RevealText({
  as: Tag = "h1",
  children,
  className,
  by = "lines",
  delay = 0,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  by?: "lines" | "words";
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!ref.current || reduced()) return;
      const split = SplitText.create(ref.current, {
        type: by === "lines" ? "lines" : "words,lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) => {
          // masks clip at the line box; give descenders (g, y, p) room without shifting layout
          gsap.set(self.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
          return gsap.from(by === "lines" ? self.lines : self.words, {
            yPercent: 110,
            duration: 0.8,
            stagger: 0.05,
            delay,
            ease: "expo.out",
          });
        },
      });
      return () => split.revert();
    },
    { scope: ref }
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

export type NumberFormat = "money" | "compact-money" | "number" | "percent";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

/** Indian-style formats: ₹1,23,456.00 · ₹9.12 Cr · 12,345 · 22.6% */
export function formatNumber(v: number, f: NumberFormat = "number"): string {
  if (f === "money") return money.format(v);
  if (f === "percent") return `${dec.format(v)}%`;
  if (f === "compact-money") {
    const a = Math.abs(v);
    if (a >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${whole.format(v)}`;
  }
  return whole.format(v);
}

/** Digits scramble into the final value on mount / change. SSR renders the final text. */
export function ScrambleNumber({
  value,
  format = "number",
  className,
  duration = 0.9,
  delay = 0,
}: {
  value: number;
  format?: NumberFormat;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = formatNumber(value, format);
  useGSAP(
    () => {
      if (!ref.current || reduced()) return;
      gsap.to(ref.current, {
        duration,
        delay,
        ease: "none",
        scrambleText: { text, chars: "0123456789", speed: 0.5, revealDelay: duration * 0.35 },
      });
    },
    { dependencies: [text], scope: ref }
  );
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}

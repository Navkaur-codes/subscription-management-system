"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { gsap, reduced, useGSAP } from "./gsap";

const ring = (r: number) => `M50,${50 - r} a${r},${r} 0 1,1 0,${2 * r} a${r},${r} 0 1,1 0,${-2 * r}`;

/**
 * Brand motif: thin ink loop with ember dots travelling around it (each dot = a payment coming back).
 * Ring colour follows `currentColor`; dots are ember. Paused while off-screen.
 */
export function Orbit({
  size = 160,
  dots = 3,
  speed = 18,
  inner,
  className,
  children,
}: {
  size?: number;
  dots?: number;
  /** seconds per lap of the outer ring */
  speed?: number;
  /** second, dashed inner ring with a counter-rotating dot (default: on when size ≥ 64) */
  inner?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const id = useId().replace(/:/g, "");
  const showInner = inner ?? size >= 64;
  const small = size < 48;
  const outerR = small ? 40 : 46;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const t = gsap.timeline({ repeat: -1 });
      root.querySelectorAll<SVGCircleElement>("[data-dot=outer]").forEach((d, i, all) => {
        const start = i / all.length;
        t.to(d, { duration: speed, ease: "none", motionPath: { path: `#o${id}`, align: `#o${id}`, alignOrigin: [0.5, 0.5], start, end: start + 1 } }, 0);
      });
      root.querySelectorAll<SVGCircleElement>("[data-dot=inner]").forEach((d) => {
        t.to(d, { duration: speed, ease: "none", motionPath: { path: `#i${id}`, align: `#i${id}`, alignOrigin: [0.5, 0.5], start: 0.5, end: -0.5 } }, 0);
      });
      tl.current = t;
      if (reduced()) t.progress(0.08).pause();
    },
    { scope: ref, dependencies: [dots, speed, showInner] }
  );

  useEffect(() => {
    const root = ref.current;
    if (!root || reduced()) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.current?.play() : tl.current?.pause()));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("relative shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <path id={`o${id}`} d={ring(outerR)} fill="none" stroke="currentColor" strokeWidth={small ? 9 : 0.6} opacity={small ? 1 : 0.55} />
        {showInner && (
          <path id={`i${id}`} d={ring(30)} fill="none" stroke="currentColor" strokeWidth={0.5} strokeDasharray="1.5 3" opacity={0.4} />
        )}
        {Array.from({ length: Math.max(1, dots) }, (_, i) => (
          <circle key={i} data-dot="outer" r={small ? 11 : i === 0 ? 3 : 2.2} fill="var(--ember)" cx={50} cy={50 - outerR} />
        ))}
        {showInner && <circle data-dot="inner" r={1.8} fill="var(--ember)" opacity={0.7} cx={50} cy={80} />}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

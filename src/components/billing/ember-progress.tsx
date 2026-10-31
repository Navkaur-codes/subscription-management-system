"use client";
import { useEffect, useState } from "react";

/** Ember progress rule that draws in from zero on mount (CSS transition, honours reduced motion). */
export function EmberProgress({ pct, label }: { pct: number; label: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    // a timeout (not rAF) so the bar still reaches its value in background tabs
    const id = setTimeout(() => setW(pct), 60);
    return () => clearTimeout(id);
  }, [pct]);
  return (
    <div className="relative h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-ember transition-[width] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

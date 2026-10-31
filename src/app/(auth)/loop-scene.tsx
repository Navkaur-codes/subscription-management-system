"use client";
/**
 * The Brightloop "loop": the product's lifecycle (Plan → Subscription → Invoice → Payment)
 * as an orbit. An ember payment travels the ring and lights each station as it passes.
 * Bespoke to the auth screens, so it drives GSAP directly instead of the shared primitives.
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";

const C = { x: 360, y: 320 };
const R = { outer: 230, mid: 160, inner: 96 };
const ring = (r: number) => `M${C.x},${C.y - r} a${r},${r} 0 1,1 0,${2 * r} a${r},${r} 0 1,1 0,${-2 * r}`;

// Stations sit at 12, 3, 6 and 9 o'clock — the leader reaches them at progress 0, .25, .5, .75.
const STATIONS = [
  { label: "Plan", x: C.x, y: C.y - R.outer, lx: C.x, ly: C.y - R.outer - 22, anchor: "middle" },
  { label: "Subscription", x: C.x + R.outer, y: C.y, lx: C.x + R.outer + 20, ly: C.y + 4, anchor: "start" },
  { label: "Invoice", x: C.x, y: C.y + R.outer, lx: C.x, ly: C.y + R.outer + 32, anchor: "middle" },
  { label: "Payment", x: C.x - R.outer, y: C.y, lx: C.x - R.outer - 20, ly: C.y + 4, anchor: "end" },
] as const;

const TRAIL = 6;
const LAP = 10; // seconds per cycle

export function LoopScene({ compact = false }: { compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const outer = root.current!.querySelector<SVGPathElement>("#bl-outer")!;
      const mid = root.current!.querySelector<SVGPathElement>("#bl-mid")!;

      // Entrance: rings draw, stations pop, MRR scrambles in.
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from(q("[data-ring]"), { drawSVG: "0%", duration: reduced ? 0 : 1.6, stagger: 0.15 })
        .from(q("[data-station]"), { scale: 0, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.12 }, "-=1.1")
        .from(q("[data-label]"), { opacity: 0, y: 6, duration: 0.6, stagger: 0.08 }, "-=0.6");
      const mrr = q("[data-mrr]")[0];
      if (mrr && !reduced)
        intro.to(mrr, { duration: 1.4, scrambleText: { text: "₹9.12 Cr", chars: "0123456789", speed: 0.5 } }, 0.4);

      if (reduced) return;

      // Leader payment + fading trail, all on the outer ring.
      const ping = (i: number) => {
        const s = q(`[data-station="${i}"]`)[0];
        const l = q(`[data-label="${i}"]`)[0];
        gsap.fromTo(s, { scale: 1.9, fill: "#ff5b1f" }, { scale: 1, fill: "#12110d", duration: 1.1, ease: "power3.out", transformOrigin: "50% 50%" });
        gsap.fromTo(l, { fill: "#ff7a3d" }, { fill: "rgba(243,239,230,0.55)", duration: 1.4 });
      };
      let last = -1;
      q("[data-dot]").forEach((dot, i) => {
        const t = gsap.to(dot, {
          motionPath: { path: outer, align: outer, alignOrigin: [0.5, 0.5] },
          duration: LAP,
          ease: "none",
          repeat: -1,
          onUpdate:
            i === 0
              ? function (this: gsap.core.Tween) {
                  const station = Math.floor(((this.progress() + 0.005) % 1) * 4);
                  if (station !== last) {
                    last = station;
                    ping(station);
                  }
                }
              : undefined,
        });
        t.seek(LAP - i * 0.09 + LAP); // trail sits just behind the leader
      });

      // Counter-rotating secondary orbit: dots spaced a third of a lap apart from the first frame
      // (seek, not delay — a delayed dot would sit at the SVG origin until it starts).
      q("[data-mid-dot]").forEach((dot, i, all) => {
        const lap = LAP * 1.6;
        gsap
          .to(dot, { motionPath: { path: mid, align: mid, alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: lap, ease: "none", repeat: -1 })
          .seek((lap / all.length) * i + lap);
      });
      gsap.to(q("[data-inner]"), { rotation: 360, transformOrigin: `${C.x}px ${C.y}px`, duration: 60, ease: "none", repeat: -1 });

      // Gentle parallax tilt following the pointer.
      if (!compact && root.current) {
        const el = root.current;
        const rx = gsap.quickTo(q("[data-tilt]"), "rotationX", { duration: 0.8, ease: "power3.out" });
        const ry = gsap.quickTo(q("[data-tilt]"), "rotationY", { duration: 0.8, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const b = el.getBoundingClientRect();
          ry(((e.clientX - b.left) / b.width - 0.5) * 10);
          rx(-((e.clientY - b.top) / b.height - 0.5) * 8);
        };
        el.addEventListener("pointermove", move);
        return () => el.removeEventListener("pointermove", move);
      }
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative h-full w-full [perspective:1200px]">
      <div data-tilt className="h-full w-full [transform-style:preserve-3d]">
        <svg viewBox="0 0 720 640" className="h-full w-full overflow-visible" aria-hidden>
          <defs>
            <radialGradient id="bl-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff5b1f" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff5b1f" stopOpacity="0" />
            </radialGradient>
            <filter id="bl-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <circle cx={C.x} cy={C.y} r={R.inner + 40} fill="url(#bl-core)" />
          <path id="bl-outer" data-ring d={ring(R.outer)} fill="none" stroke="rgba(243,239,230,0.22)" strokeWidth="1.2" />
          <path id="bl-mid" data-ring d={ring(R.mid)} fill="none" stroke="rgba(243,239,230,0.1)" strokeWidth="1" />
          <g data-inner>
            <circle cx={C.x} cy={C.y} r={R.inner} fill="none" stroke="rgba(243,239,230,0.14)" strokeWidth="1" strokeDasharray="2 7" />
          </g>

          {/* Tick marks on the outer ring, like a dial */}
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const r1 = R.outer + 8;
            const r2 = R.outer + (i % 4 === 0 ? 16 : 12);
            // Rounded so server and client render identical attributes (float noise breaks hydration).
            const p = (v: number) => Math.round(v * 100) / 100;
            return (
              <line
                key={i}
                x1={p(C.x + Math.sin(a) * r1)}
                y1={p(C.y - Math.cos(a) * r1)}
                x2={p(C.x + Math.sin(a) * r2)}
                y2={p(C.y - Math.cos(a) * r2)}
                stroke="rgba(243,239,230,0.12)"
                strokeWidth="1"
              />
            );
          })}

          {[0, 1, 2].map((i) => (
            <circle key={i} data-mid-dot r="3" fill="rgba(243,239,230,0.55)" />
          ))}

          {STATIONS.map((s, i) => (
            <g key={s.label}>
              <circle data-station={i} cx={s.x} cy={s.y} r="7" fill="#12110d" stroke="rgba(243,239,230,0.7)" strokeWidth="1.4" />
              {!compact && (
                <text
                  data-label={i}
                  x={s.lx}
                  y={s.ly}
                  textAnchor={s.anchor}
                  fill="rgba(243,239,230,0.55)"
                  style={{ font: "500 13px var(--font-geist-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  {s.label}
                </text>
              )}
            </g>
          ))}

          {Array.from({ length: TRAIL }, (_, i) => (
            <circle
              key={i}
              data-dot
              r={i === 0 ? 7 : 5 - i * 0.6}
              fill="#ff5b1f"
              opacity={i === 0 ? 1 : 0.55 - i * 0.08}
              filter={i === 0 ? "url(#bl-glow)" : undefined}
            />
          ))}

          {!compact && (
            <g textAnchor="middle">
              <text x={C.x} y={C.y - 30} fill="rgba(243,239,230,0.5)" style={{ font: "500 11px var(--font-geist-mono)", letterSpacing: "0.16em" }}>
                MRR · LIVE
              </text>
              <text data-mrr x={C.x} y={C.y + 18} fill="#f3efe6" style={{ font: "400 56px var(--font-instrument)" }}>
                ₹9.12 Cr
              </text>
              <text x={C.x} y={C.y + 48} fill="#ff7a3d" style={{ font: "500 13px var(--font-geist-mono)" }}>
                ▲ 22.6% this month
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

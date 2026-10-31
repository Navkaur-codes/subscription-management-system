import { ArrowUpRight, CheckCircle2, TrendingUp } from "lucide-react";
import { Float } from "@/components/motion";

const glass = "rounded-2xl bg-white/[0.08] p-4 text-white shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)] ring-1 ring-white/15 backdrop-blur-xl";

/** Decorative product preview for the auth hero panel — static SVG, no chart lib. */
export function AuthPreview() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[460px]">
      <Float className="absolute top-0 left-0 w-[260px]" amplitude={8} duration={4.5}>
        <div className={glass}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/70">Monthly recurring revenue</p>
            <span className="flex size-7 items-center justify-center rounded-lg bg-white/15">
              <TrendingUp className="size-3.5" />
            </span>
          </div>
          <p className="num mt-2 text-[26px] font-semibold tracking-tight">₹9,51,34,094</p>
          <div className="mt-1 flex items-end justify-between">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold">
              <ArrowUpRight className="size-3" />
              +12.4%
            </span>
            <svg viewBox="0 0 100 32" className="h-8 w-24" fill="none" aria-hidden>
              <path d="M0 26 L14 22 L28 24 L42 16 L56 18 L70 10 L84 12 L100 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Float>

      <Float className="absolute top-[150px] right-0 w-[230px]" amplitude={10} duration={5.2} delay={0.15}>
        <div className={glass}>
          <p className="text-xs font-medium text-white/70">Revenue · last 6 months</p>
          <svg viewBox="0 0 200 80" className="mt-3 h-20 w-full" aria-hidden>
            <defs>
              <linearGradient id="auth-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.45" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 62 C25 58 35 48 60 50 S100 30 125 34 S165 14 200 10 L200 80 L0 80 Z" fill="url(#auth-area)" />
            <path d="M0 62 C25 58 35 48 60 50 S100 30 125 34 S165 14 200 10" fill="none" stroke="white" strokeWidth="2.25" strokeLinecap="round" />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-white/60">
            {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </Float>

      <Float className="absolute bottom-0 left-8" amplitude={6} duration={3.8} delay={0.3}>
        <div className={`${glass} flex items-center gap-3 py-3`}>
          <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 className="size-4.5" />
          </span>
          <div className="leading-tight">
            <p className="num text-sm font-semibold">INV/2026/00042</p>
            <p className="text-xs text-white/70">Paid · ₹68,145.00</p>
          </div>
        </div>
      </Float>
    </div>
  );
}

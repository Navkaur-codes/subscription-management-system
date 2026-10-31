import type { ReactNode } from "react";
import { Check, Circle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/shared/status-badge";

const AVATAR_BG = [
  "bg-ember text-white",
  "bg-primary text-primary-foreground",
  "bg-chart-3 text-ink",
  "bg-chart-4 text-ink",
  "bg-chart-5 text-white",
  "bg-secondary text-foreground ring-1 ring-border ring-inset",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Initials avatar (colour from name hash) + name + muted sub line. */
export function AvatarName({
  name,
  sub,
  size = "md",
  className,
}: {
  name: string;
  sub?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-mono-num font-semibold",
          AVATAR_BG[hash(name) % AVATAR_BG.length],
          size === "sm" && "size-7 text-[10px]",
          size === "md" && "size-8 text-xs",
          size === "lg" && "size-11 text-sm"
        )}
      >
        {initials(name)}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-medium text-foreground">{name}</span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    </span>
  );
}

/** Horizontal summary bar above tables (count / total / outstanding). */
export function MetricStrip({ items, className }: { items: { label: string; value: ReactNode; hint?: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card sm:flex", className)}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0 flex-1 bg-card px-5 py-4">
          <p className="truncate font-mono-num text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">{i.label}</p>
          <p className="mt-1.5 font-mono-num text-base font-medium break-words sm:truncate sm:text-lg">{i.value}</p>
          {i.hint && <p className="truncate text-xs text-muted-foreground">{i.hint}</p>}
        </div>
      ))}
    </div>
  );
}

const TL_TONE: Record<Tone | "brand", string> = {
  brand: "bg-ember text-white",
  neutral: "bg-neutral-soft text-neutral",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

/** Vertical activity timeline. */
export function Timeline({
  items,
}: {
  items: { title: ReactNode; description?: ReactNode; time: ReactNode; icon?: LucideIcon; tone?: Tone | "brand" }[];
}) {
  return (
    <ol className="relative space-y-5">
      {items.map((it, idx) => {
        const Icon = it.icon ?? Circle;
        return (
          <li key={idx} className="relative flex gap-3">
            {idx < items.length - 1 && (
              <span aria-hidden className="absolute top-8 bottom-[-20px] left-[13px] w-px bg-border" />
            )}
            <span
              className={cn(
                "relative flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                TL_TONE[it.tone ?? "neutral"]
              )}
            >
              <Icon className={cn("size-3.5", !it.icon && "size-2 fill-current")} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">{it.title}</p>
                <p className="font-mono-num text-[11px] text-muted-foreground">{it.time}</p>
              </div>
              {it.description && <p className="mt-0.5 text-xs text-muted-foreground">{it.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Lifecycle progress. `current` = index of the active step; `side` = off-path state label (e.g. "Paused"). */
export function Stepper({ steps, current, side }: { steps: string[]; current: number; side?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-y-3">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full font-mono-num text-[11px] font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-ember text-white ring-4 ring-ember-soft",
                  !done && !active && "bg-muted text-muted-foreground ring-1 ring-border ring-inset"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("text-xs font-medium whitespace-nowrap", active ? "text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("mx-2 h-px w-6 sm:mx-3 sm:w-10", i < current ? "bg-foreground" : "bg-border")} />
            )}
          </div>
        );
      })}
      {side && (
        <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
          <span className="size-1.5 rounded-full bg-dot-warning" />
          {side}
        </span>
      )}
    </div>
  );
}

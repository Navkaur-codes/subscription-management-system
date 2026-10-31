import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/shared/charts";
import { ScrambleNumber, type NumberFormat } from "@/components/motion";

type KpiTone = "brand" | "success" | "warning" | "danger" | "info";

const SPARK: Record<KpiTone, string> = {
  brand: "var(--chart-1)",
  success: "var(--chart-2)",
  warning: "var(--chart-4)",
  danger: "var(--chart-6)",
  info: "var(--chart-5)",
};

const card = "rounded-xl border border-border bg-card shadow-card";

/**
 * KPI cell: mono label, big serif number (scrambles in when `numeric` is given), delta, sparkline.
 * Several KPIs read best inside <KpiStrip> (one card, vertical rules between cells).
 */
export function KpiCard({
  label,
  value,
  numeric,
  icon: Icon,
  delta,
  deltaLabel,
  trend,
  tone = "brand",
  className,
}: {
  label: string;
  value?: ReactNode;
  numeric?: { value: number; format?: NumberFormat };
  icon?: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  trend?: number[];
  tone?: KpiTone;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div data-stagger className={cn(card, "relative flex flex-col p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono-num text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
        {Icon && <Icon className={cn("size-4", tone === "danger" ? "text-danger" : "text-muted-foreground")} strokeWidth={1.75} />}
      </div>
      <p className={cn("mt-3 font-display text-[40px] leading-none tracking-tight", tone === "danger" && "text-danger")}>
        {numeric ? <ScrambleNumber value={numeric.value} format={numeric.format} /> : value}
      </p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          {delta !== undefined && (
            <span className={cn("font-mono-num font-medium", up ? "text-success" : "text-danger")}>
              {up ? "▲" : "▼"} {up ? "+" : ""}
              {Math.round(delta * 10) / 10}%
            </span>
          )}
          {deltaLabel && <span className="truncate text-muted-foreground">{deltaLabel}</span>}
        </div>
        {trend && trend.length > 1 && (
          <div className="h-8 w-24 shrink-0">
            <Sparkline data={trend} color={SPARK[tone]} height={32} />
          </div>
        )}
      </div>
    </div>
  );
}

/** One card holding several KpiCards separated by hairline rules. */
export function KpiStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // 1px gaps over a border-coloured backdrop = hairline rules between cells at every breakpoint
        "grid gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col",
        "[&>*]:rounded-none [&>*]:border-0 [&>*]:shadow-none",
        className
      )}
    >
      {children}
    </div>
  );
}

/** KPI tile (legacy props). Pass <CountUp>/<ScrambleNumber> as value. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div data-stagger className={cn(card, "p-5")}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono-num text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
        {icon && (
          <span className={cn("[&_svg]:size-4", tone === "danger" ? "text-danger" : "text-muted-foreground")}>{icon}</span>
        )}
      </div>
      <p className={cn("mt-3 font-display text-[36px] leading-none tracking-tight", tone === "danger" && "text-danger")}>{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Label/value pairs for detail pages. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="border-l border-border pl-3">
          <dt className="font-mono-num text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">{i.label}</dt>
          <dd className="mt-1 text-sm font-medium">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

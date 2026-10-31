import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/shared/charts";

type KpiTone = "brand" | "success" | "warning" | "danger" | "info";

const TILE: Record<KpiTone, string> = {
  brand: "bg-brand-gradient text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-6px_rgb(76_50_220/0.6)]",
  success: "bg-success-soft text-success ring-1 ring-current/15 ring-inset",
  warning: "bg-warning-soft text-warning ring-1 ring-current/15 ring-inset",
  danger: "bg-danger-soft text-danger ring-1 ring-current/15 ring-inset",
  info: "bg-info-soft text-info ring-1 ring-current/15 ring-inset",
};

const SPARK: Record<KpiTone, string> = {
  brand: "var(--chart-1)",
  success: "var(--chart-4)",
  warning: "var(--chart-5)",
  danger: "var(--chart-6)",
  info: "var(--chart-3)",
};

/** Premium KPI tile: icon tile, big number, delta chip, optional sparkline. Pass <CountUp> as value. */
export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  trend,
  tone = "brand",
  className,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  trend?: number[];
  tone?: KpiTone;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div data-stagger className={cn("card-surface card-hover relative overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TILE[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="num mt-2 text-[28px] leading-9 font-semibold tracking-tight sm:text-[30px]">{value}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={cn(
                "num inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
                up ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
              )}
            >
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {up ? "+" : ""}
              {Math.round(delta * 10) / 10}%
            </span>
          )}
          {deltaLabel && <span className="truncate text-muted-foreground">{deltaLabel}</span>}
        </div>
        {trend && trend.length > 1 && (
          <div className="h-9 w-24 shrink-0">
            <Sparkline data={trend} color={SPARK[tone]} />
          </div>
        )}
      </div>
    </div>
  );
}

/** KPI tile (legacy props). Pass <CountUp> as value for the animated count. */
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
    <div data-stagger className="card-surface card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4",
              tone === "danger" ? TILE.danger : "bg-brand-soft text-brand"
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className={cn("num mt-2 text-[28px] leading-9 font-semibold tracking-tight", tone === "danger" && "text-danger")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Label/value pairs for detail pages. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="eyebrow">{i.label}</dt>
          <dd className="mt-1 text-sm font-medium">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

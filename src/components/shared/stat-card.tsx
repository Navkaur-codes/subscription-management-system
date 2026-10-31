import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** KPI tile. Pass <CountUp> as value for the animated count. */
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
    <div data-stagger className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
      </div>
      <p className={cn("num mt-2 text-2xl font-semibold", tone === "danger" && "text-destructive")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Label/value pairs for detail pages. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className="mt-0.5 text-sm font-medium">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

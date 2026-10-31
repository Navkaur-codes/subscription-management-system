import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/shared/charts";

const COLS: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };

export type KpiCell = {
  label: string;
  value: ReactNode;
  delta?: number;
  hint?: string;
  trend?: number[];
  danger?: boolean;
};

/** One ruled card of KPI cells separated by vertical hairlines. */
export function KpiStrip({ cells }: { cells: KpiCell[] }) {
  return (
    <div data-stagger className={cn("card-surface grid grid-cols-2 overflow-hidden", COLS[cells.length] ?? "lg:grid-cols-5")}>
      {cells.map((c, i) => {
        const up = (c.delta ?? 0) >= 0;
        return (
          <div
            key={c.label}
            className={cn(
              "flex min-w-0 flex-col gap-3 border-border p-5",
              i > 0 && "lg:border-l",
              i % 2 === 1 && "border-l lg:border-l",
              i >= 2 && "border-t lg:border-t-0",
              i === cells.length - 1 && cells.length % 2 === 1 && "col-span-2 lg:col-span-1"
            )}
          >
            <p className="eyebrow">{c.label}</p>
            <p className={cn("font-mono-num text-2xl font-medium tracking-tight xl:text-[26px]", c.danger && "text-danger")}>{c.value}</p>
            <div className="flex items-end justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                {c.delta !== undefined && (
                  <span className={cn("font-mono-num inline-flex items-center font-medium", up ? "text-success" : "text-danger")}>
                    {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {Math.abs(Math.round(c.delta * 10) / 10)}%
                  </span>
                )}
                <span className="truncate">{c.hint}</span>
              </p>
              {c.trend && c.trend.length > 1 && (
                <div className="h-8 w-16 shrink-0">
                  <Sparkline data={c.trend} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

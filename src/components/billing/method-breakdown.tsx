import { formatCompactMoney, formatMoney } from "@/lib/format";
import { EmberProgress } from "./ember-progress";

/** Payment methods side by side: rank, name, compact amount, share and an ember share bar. */
export function MethodBreakdown({ rows, total }: { rows: { name: string; value: number }[]; total: number }) {
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">No payments yet</p>;
  return (
    <ol className="grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col">
      {rows.map((r, i) => {
        const pct = total > 0 ? Math.round((r.value / total) * 1000) / 10 : 0;
        return (
          <li key={r.name} className="flex flex-col gap-3 bg-card p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-baseline gap-2 text-sm font-medium">
                <span className="font-mono-num text-[10.5px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {r.name}
              </span>
              <span className="font-mono-num text-xs text-muted-foreground">{pct}%</span>
            </div>
            <p className="font-display text-[28px] leading-none" title={formatMoney(r.value)}>
              {formatCompactMoney(r.value)}
            </p>
            <EmberProgress pct={pct} label={`${r.name} share`} />
          </li>
        );
      })}
    </ol>
  );
}

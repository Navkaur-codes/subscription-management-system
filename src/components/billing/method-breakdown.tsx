import { formatMoney } from "@/lib/format";
import { EmberProgress } from "./ember-progress";

/** Ruled list of payment methods by amount, each with an ember share bar. */
export function MethodBreakdown({ rows, total }: { rows: { name: string; value: number }[]; total: number }) {
  if (!rows.length) return <p className="py-16 text-center text-sm text-muted-foreground">No payments yet</p>;
  return (
    <ol className="divide-y">
      {rows.map((r, i) => {
        const pct = total > 0 ? Math.round((r.value / total) * 1000) / 10 : 0;
        return (
          <li key={r.name} className="py-3 first:pt-0 last:pb-0">
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-baseline gap-2">
                <span className="font-mono-num text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium">{r.name}</span>
              </span>
              <span className="font-mono-num">
                {formatMoney(r.value)} <span className="text-muted-foreground">· {pct}%</span>
              </span>
            </div>
            <EmberProgress pct={pct} label={`${r.name} share`} />
          </li>
        );
      })}
    </ol>
  );
}

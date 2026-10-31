import { shortMoney } from "@/lib/insights/money";

/** Ruled ranked list (e.g. top plans by monthly revenue) with a thin ember share bar. */
export function PlanBars({ items }: { items: { name: string; subs: number; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className="divide-y">
      {items.map((i, idx) => (
        <li key={i.name} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-3">
              <span className="font-mono-num text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
              <span className="truncate font-medium">{i.name}</span>
            </span>
            <span className="font-mono-num shrink-0">{shortMoney(i.value)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 pl-8">
            <div className="h-px flex-1 bg-border">
              <div className="h-px bg-ember" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
            </div>
            <span className="font-mono-num text-[11px] text-muted-foreground">{i.subs.toLocaleString("en-IN")} subs</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

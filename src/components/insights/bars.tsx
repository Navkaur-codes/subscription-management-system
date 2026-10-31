import { shortMoney } from "@/lib/insights/money";

/** Ranked horizontal bars (e.g. top plans by monthly revenue). */
export function PlanBars({ items }: { items: { name: string; subs: number; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.name}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{i.name}</span>
            <span className="num shrink-0 text-muted-foreground">
              {shortMoney(i.value)} <span className="text-xs">· {i.subs.toLocaleString("en-IN")} subs</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-brand-gradient" style={{ width: `${Math.max(3, (i.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

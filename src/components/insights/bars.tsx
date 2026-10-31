import { formatMoney, humanize } from "@/lib/format";

/** Horizontal share bars (monochrome). */
export function StatusBars({ items }: { items: { status: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.status} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="text-muted-foreground">{humanize(i.status)}</span>
          <span className="h-2 rounded-full bg-muted">
            <span className="block h-2 rounded-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
          </span>
          <span className="num text-right">{i.count.toLocaleString("en-IN")}</span>
        </li>
      ))}
    </ul>
  );
}

/** Vertical bars; the current period uses the brand accent. */
export function RevenueBars({ items }: { items: { label: string; value: number; current: boolean }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex h-48 items-end gap-3">
      {items.map((i) => (
        <div key={i.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="num text-[11px] text-muted-foreground">{formatMoney(i.value).replace(".00", "")}</span>
          <div
            className={i.current ? "w-full rounded-t-md bg-brand" : "w-full rounded-t-md bg-primary/80"}
            style={{ height: `${Math.max(2, (i.value / max) * 75)}%` }}
          />
          <span className="text-xs text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

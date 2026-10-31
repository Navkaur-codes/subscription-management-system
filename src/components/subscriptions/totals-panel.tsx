import { formatMoney } from "@/lib/format";
import type { PricedTotals } from "@/lib/pricing";

/** Ruled receipt: mono figures with dotted leaders, double rule, serif total. Server- and client-safe. */
export function TotalsPanel({ totals }: { totals: PricedTotals }) {
  const rows = [
    { k: "Subtotal", v: totals.subtotal },
    { k: "Discount", v: -totals.discountTotal },
    { k: "Tax", v: totals.taxTotal },
  ];
  return (
    <dl className="ml-auto w-full max-w-sm text-sm">
      {rows.map((r) => (
        <div key={r.k} className="flex items-baseline gap-2 py-1 text-muted-foreground">
          <dt>{r.k}</dt>
          <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-border" />
          <dd className="font-mono-num text-foreground">{formatMoney(r.v)}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-baseline justify-between gap-3 border-t-[3px] border-double border-foreground/70 pt-3">
        <dt className="font-display text-xl">
          Total <em>per period</em>
        </dt>
        <dd className="font-mono-num text-lg font-semibold">{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}

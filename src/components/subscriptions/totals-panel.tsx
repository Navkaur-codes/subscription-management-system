import { formatMoney } from "@/lib/format";
import type { PricedTotals } from "@/lib/pricing";

/** Subtotal / discount / tax / total summary. Works in server and client components. */
export function TotalsPanel({ totals, label = "Total" }: { totals: PricedTotals; label?: string }) {
  const rows = [
    { k: "Subtotal", v: totals.subtotal },
    { k: "Discount", v: -totals.discountTotal },
    { k: "Tax", v: totals.taxTotal },
  ];
  return (
    <dl className="num ml-auto w-full max-w-xs space-y-1.5 text-sm">
      {rows.map((r) => (
        <div key={r.k} className="flex justify-between text-muted-foreground">
          <dt>{r.k}</dt>
          <dd>{formatMoney(r.v)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 font-semibold text-foreground">
        <dt>{label}</dt>
        <dd>{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}

import { Check, CircleAlert } from "lucide-react";
import type { PricedTotals } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TotalsPanel } from "./totals-panel";

type ReadyCheck = { ok: boolean; label: string };

/** Sticky right-hand summary on the subscription form: live totals + readiness checks. */
export function FormSummary({
  customer,
  plan,
  totals,
  checks,
}: {
  customer?: string;
  plan?: string;
  totals: PricedTotals;
  checks: ReadyCheck[];
}) {
  return (
    <aside className="card-surface p-5 lg:sticky lg:top-20 lg:self-start">
      <p className="eyebrow">Summary</p>
      <p className="mt-3 truncate text-sm font-semibold">{customer ?? "No customer yet"}</p>
      <p className="truncate text-xs text-muted-foreground">{plan ?? "Choose a plan"}</p>

      <div className="mt-5 border-t pt-4">
        <p className="eyebrow">Recurring total</p>
        <p className="num mt-1 text-3xl font-semibold tracking-tight">
          {formatMoney(totals.total)}
        </p>
      </div>

      <div className="mt-4">
        <TotalsPanel totals={totals} label="Total per period" />
      </div>

      <ul className="mt-5 space-y-2 border-t pt-4 text-xs">
        {checks.map((c) => (
          <li key={c.label} className={cn("flex items-start gap-2", c.ok ? "text-muted-foreground" : "text-destructive")}>
            {c.ok ? <Check className="mt-px size-3.5 shrink-0" /> : <CircleAlert className="mt-px size-3.5 shrink-0" />}
            {c.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

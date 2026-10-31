import { Check, CircleAlert } from "lucide-react";
import type { PricedTotals } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { TotalsPanel } from "./totals-panel";

type ReadyCheck = { ok: boolean; label: string };

/** Sticky right-hand receipt on the subscription form: live totals + readiness checks. */
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
      <p className="eyebrow">Receipt preview</p>
      <div className="mt-3 border-y border-dashed py-3">
        <p className="font-display truncate text-2xl leading-tight">{customer ?? <em className="text-muted-foreground">No customer yet</em>}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{plan ?? "Choose a plan"}</p>
      </div>

      <div className="mt-4">
        <TotalsPanel totals={totals} />
      </div>

      <ul className="mt-5 space-y-2 border-t border-dashed pt-4 text-xs">
        {checks.map((c) => (
          <li key={c.label} className={cn("flex items-start gap-2", c.ok ? "text-muted-foreground" : "text-destructive")}>
            {c.ok ? <Check className="mt-px size-3.5 shrink-0 text-ember" /> : <CircleAlert className="mt-px size-3.5 shrink-0" />}
            {c.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

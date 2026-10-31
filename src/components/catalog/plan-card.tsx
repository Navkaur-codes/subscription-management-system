import Link from "next/link";
import { ScrambleNumber } from "@/components/motion";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";

const PER: Record<string, string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
};

export type PlanCardData = {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  minQuantity: number;
  startDate: Date | null;
  endDate: Date | null;
  autoClose: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  isActive: boolean;
  activeSubs: number;
};

export function planChips(
  p: Pick<PlanCardData, "autoClose" | "closable" | "pausable" | "renewable">,
) {
  return [
    p.pausable && "Pausable",
    p.renewable && "Renewable",
    p.closable && "Closable",
    p.autoClose && "Auto-close",
  ].filter((x): x is string => !!x);
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono-num inline-flex items-center rounded-md border bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

export function availability(p: Pick<PlanCardData, "startDate" | "endDate">) {
  if (!p.startDate && !p.endDate) return "Always available";
  return `${formatDate(p.startDate)} → ${formatDate(p.endDate)}`;
}

/** One editorial pricing column; the grid around it draws the rules. */
export function PlanCard({ plan: p }: { plan: PlanCardData }) {
  const chips = planChips(p);
  return (
    <Link
      href={`/plans/${p.id}`}
      data-stagger
      className="group relative flex flex-col border-r border-b bg-card p-6 transition-colors hover:bg-muted/30"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-ember transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{p.name}</p>
        <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
      </div>
      <p className="font-display mt-6 text-5xl leading-none tracking-tight">
        <ScrambleNumber value={p.price} format="money" />
      </p>
      <p className="font-mono-num mt-2 text-xs text-muted-foreground">
        per {PER[p.billingPeriod] ?? "period"} · min qty {p.minQuantity}
      </p>
      <div className="mt-5 flex min-h-12 flex-wrap content-start gap-1.5">
        {chips.length ? (
          chips.map((c) => <Chip key={c}>{c}</Chip>)
        ) : (
          <Chip>No options</Chip>
        )}
      </div>
      <dl className="font-mono-num mt-5 grid gap-1.5 border-t pt-4 text-xs text-muted-foreground">
        <div className="flex justify-between gap-3">
          <dt>Window</dt>
          <dd className="text-right text-foreground">{availability(p)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Active subs</dt>
          <dd className="text-foreground">
            {p.activeSubs.toLocaleString("en-IN")}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

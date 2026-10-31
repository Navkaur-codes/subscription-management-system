import Link from "next/link";
import { CalendarRange, Users } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatMoney } from "@/lib/format";

const PER: Record<string, string> = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" };

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

export function planChips(p: Pick<PlanCardData, "autoClose" | "closable" | "pausable" | "renewable">) {
  return [
    p.pausable && "Pausable",
    p.renewable && "Renewable",
    p.closable && "Closable",
    p.autoClose && "Auto-close",
  ].filter((x): x is string => !!x);
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{children}</span>;
}

export function availability(p: Pick<PlanCardData, "startDate" | "endDate">) {
  if (!p.startDate && !p.endDate) return "Always available";
  return `${formatDate(p.startDate)} → ${formatDate(p.endDate)}`;
}

export function PlanCard({ plan: p }: { plan: PlanCardData }) {
  const chips = planChips(p);
  return (
    <Link
      href={`/plans/${p.id}`}
      data-stagger
      className="card-hover group flex flex-col rounded-2xl border bg-card p-6 shadow-card ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 dark:ring-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold">{p.name}</h3>
        <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
      </div>
      <p className="num mt-5 text-3xl font-semibold tracking-tight">
        {formatMoney(p.price)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">/ {PER[p.billingPeriod] ?? "period"}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Minimum quantity {p.minQuantity}</p>
      <div className="mt-4 flex min-h-12 flex-wrap content-start gap-1.5">
        {chips.length ? chips.map((c) => <Chip key={c}>{c}</Chip>) : <Chip>No options</Chip>}
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarRange className="size-3.5" />
          {availability(p)}
        </span>
        <span className="num flex items-center gap-1.5">
          <Users className="size-3.5" />
          {p.activeSubs} active
        </span>
      </div>
    </Link>
  );
}

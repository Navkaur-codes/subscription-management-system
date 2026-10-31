import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { InvoiceWithDoc } from "@/components/shared/invoice-document";
import { formatDate, formatMoney, round2, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { cn } from "@/lib/utils";
import { AvatarName } from "@/components/shared/display";
import { ScrambleNumber } from "@/components/motion";
import { EmberProgress } from "./ember-progress";

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-mono-num mb-4 text-[11px] tracking-wider text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Amount due (scrambles in), ember progress of paid / total, and the settlement state. */
export function PaymentProgressCard({ invoice }: { invoice: InvoiceWithDoc }) {
  const total = toNum(invoice.total);
  const paid = toNum(invoice.amountPaid);
  const pct = total > 0 ? Math.min(100, round2((paid / total) * 100)) : 0;
  const due = outstanding(invoice);
  const overdue = invoice.status === "CONFIRMED" && due > 0 && invoice.dueDate < new Date();
  const open = invoice.status === "CONFIRMED";
  return (
    <SideCard title="Amount due">
      <ScrambleNumber
        value={open ? due : invoice.status === "DRAFT" ? total : 0}
        format="money"
        className={cn("font-mono-num block text-3xl font-medium tracking-tight", overdue && "text-danger")}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {invoice.status === "CANCELLED"
          ? "Cancelled — nothing to collect"
          : invoice.status === "DRAFT"
            ? "Draft — confirm to start collecting"
            : due > 0
              ? overdue
                ? `Overdue since ${formatDate(invoice.dueDate)}`
                : `Due ${formatDate(invoice.dueDate)}`
              : `Settled ${invoice.paidAt ? formatDate(invoice.paidAt) : ""}`}
      </p>
      <div className="mt-5 border-t pt-4">
        <div className="mb-2 flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Collected</span>
          <span className="font-mono-num">
            {formatMoney(paid)} <span className="text-muted-foreground">/ {formatMoney(total)}</span>
          </span>
        </div>
        <EmberProgress pct={pct} label="Share of invoice paid" />
        <p className="font-mono-num mt-2 text-right text-[11px] text-muted-foreground">{pct}%</p>
      </div>
    </SideCard>
  );
}

/** Bill-to customer with contact details and a link to the subscription. */
export function CustomerCard({ invoice }: { invoice: InvoiceWithDoc }) {
  const c = invoice.customer;
  const rows = [
    { icon: Mail, value: c.email },
    { icon: Phone, value: c.phone },
    { icon: MapPin, value: [c.city, c.gstin && `GSTIN ${c.gstin}`].filter(Boolean).join(" · ") },
  ].filter((r) => r.value);
  return (
    <SideCard title="Customer">
      <AvatarName name={c.name} sub={c.company ?? undefined} />
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map(({ icon: Icon, value }) => (
          <li key={String(value)} className="flex items-center gap-2 text-muted-foreground">
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{value}</span>
          </li>
        ))}
      </ul>
      {invoice.subscriptionId && invoice.subscription && (
        <Link
          href={`/subscriptions/${invoice.subscriptionId}`}
          className="mt-4 flex items-center justify-between border-t pt-3 text-sm transition-colors hover:text-ember"
        >
          <span className="text-muted-foreground">Subscription</span>
          <span className="font-mono-num">{invoice.subscription.number}</span>
        </Link>
      )}
    </SideCard>
  );
}

export { SideCard };

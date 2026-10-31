import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { InvoiceWithDoc } from "@/components/shared/invoice-document";
import { formatDate, formatMoney, round2, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { cn } from "@/lib/utils";
import { AvatarName } from "@/components/shared/display";

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-card ring-1 ring-black/5 dark:ring-white/10">
      <h2 className="mb-4 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Paid / total progress with the remaining balance. */
export function PaymentProgressCard({ invoice }: { invoice: InvoiceWithDoc }) {
  const total = toNum(invoice.total);
  const paid = toNum(invoice.amountPaid);
  const pct = total > 0 ? Math.min(100, round2((paid / total) * 100)) : 0;
  const due = outstanding(invoice);
  const overdue = invoice.status === "CONFIRMED" && due > 0 && invoice.dueDate < new Date();
  return (
    <SideCard title="Payment">
      <div className="flex items-baseline justify-between">
        <p className="num text-2xl font-semibold tracking-tight">{formatMoney(paid)}</p>
        <p className="num text-sm text-muted-foreground">of {formatMoney(total)}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{pct}% collected</span>
        {invoice.status === "CANCELLED" ? (
          <span className="text-muted-foreground">Cancelled</span>
        ) : invoice.status === "DRAFT" ? (
          <span className="text-muted-foreground">Confirm to collect</span>
        ) : due > 0 ? (
          <span className={cn("num font-medium", overdue && "text-danger")}>
            {formatMoney(due)} due {overdue ? "— overdue" : formatDate(invoice.dueDate)}
          </span>
        ) : (
          <span className="font-medium text-success">Settled {invoice.paidAt ? formatDate(invoice.paidAt) : ""}</span>
        )}
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
          className="mt-4 flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <span className="text-muted-foreground">Subscription</span>
          <span className="font-medium">{invoice.subscription.number}</span>
        </Link>
      )}
    </SideCard>
  );
}

export { SideCard };

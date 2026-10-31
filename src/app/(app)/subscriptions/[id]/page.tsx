import Link from "next/link";
import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, humanize, toNum } from "@/lib/format";
import { displayStatus } from "@/lib/invoice-status";
import { priceSubscription, toDiscountRule } from "@/lib/subscriptions/pricing";
import { Section } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { FadeIn, Pulse } from "@/components/motion";
import { AvatarName, Stepper, Timeline } from "@/components/shared/display";
import { StatusActions } from "@/components/subscriptions/status-actions";
import { activity } from "@/components/subscriptions/activity";
import { TotalsPanel } from "@/components/subscriptions/totals-panel";
import { BillingCard } from "@/components/subscriptions/billing-card";

export const metadata = { title: "Subscription" };

const PER = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" } as const;
const STEPS: SubscriptionStatus[] = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"];

type LineRow = { id: string; name: string; sub?: string; quantity: number; unitPrice: number; taxRate: number; discount: number; amount: number };
type InvoiceRow = { id: string; number: string; invoiceDate: Date; dueDate: Date; status: string; total: number };

const lineColumns: Column<LineRow>[] = [
  {
    key: "name",
    header: "Product",
    cell: (r) => (
      <div>
        <p className="font-medium">{r.name}</p>
        {r.sub && <p className="text-xs text-muted-foreground">{r.sub}</p>}
      </div>
    ),
  },
  { key: "qty", header: "Qty", align: "right", cell: (r) => r.quantity },
  { key: "unit", header: "Unit price", align: "right", cell: (r) => formatMoney(r.unitPrice) },
  { key: "disc", header: "Discount", align: "right", cell: (r) => (r.discount ? formatMoney(-r.discount) : "—") },
  { key: "tax", header: "Tax", align: "right", cell: (r) => `${r.taxRate}%` },
  { key: "amount", header: "Amount", align: "right", cell: (r) => <span className="font-medium">{formatMoney(r.amount)}</span> },
];

const invoiceColumns: Column<InvoiceRow>[] = [
  { key: "number", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
  { key: "date", header: "Date", cell: (r) => formatDate(r.invoiceDate) },
  { key: "due", header: "Due", cell: (r) => formatDate(r.dueDate) },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "total", header: "Total", align: "right", cell: (r) => formatMoney(r.total) },
];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const [sub, invoices] = await Promise.all([
    db.subscription.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        discount: { include: { products: true } },
        createdBy: { select: { name: true } },
        lines: { include: { product: { select: { name: true } }, variant: { select: { attribute: true, value: true } } } },
      },
    }),
    db.invoice.findMany({
      where: { subscriptionId: id },
      orderBy: { invoiceDate: "desc" },
      select: { id: true, number: true, invoiceDate: true, dueDate: true, status: true, total: true, amountPaid: true },
    }),
  ]);
  if (!sub) notFound();

  const totals = priceSubscription(sub.lines, sub.discount ? toDiscountRule(sub.discount) : null);
  const lineRows: LineRow[] = sub.lines.map((l, i) => ({
    id: l.id,
    name: l.product.name,
    sub: l.variant ? `${l.variant.attribute}: ${l.variant.value}` : undefined,
    quantity: l.quantity,
    unitPrice: totals.lines[i].unitPrice,
    taxRate: totals.lines[i].taxRate,
    discount: totals.lines[i].discountAmount,
    amount: totals.lines[i].amount,
  }));
  const invoiceRows: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    status: displayStatus(inv),
    total: toNum(inv.total),
  }));
  const period = sub.plan.billingPeriod.toLowerCase();

  return (
    <FadeIn className="space-y-8">
      <section className="card-surface p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="eyebrow">
              <Link href="/subscriptions" className="hover:text-foreground">Subscriptions</Link> / {sub.number}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-semibold tracking-tight">{sub.number}</h1>
              <Pulse trigger={sub.status}>
                <StatusBadge status={sub.status} />
              </Pulse>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link href={`/customers/${sub.customer.id}`} className="min-w-0 rounded-lg hover:opacity-80">
                <AvatarName name={sub.customer.name} sub={sub.customer.email} />
              </Link>
              <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
                {sub.plan.name} · {period}
              </span>
            </div>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="eyebrow">Recurring total</p>
            <p className="num text-[30px] font-semibold tracking-tight">{formatMoney(totals.total)}</p>
            <p className="text-xs text-muted-foreground">per {PER[sub.plan.billingPeriod]} incl. tax</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
          <StatusActions id={sub.id} status={sub.status} plan={sub.plan} />
        </div>
        <div className="mt-5 overflow-x-auto">
          <Stepper steps={STEPS.map(humanize)} current={STEPS.indexOf(sub.status === "PAUSED" ? "ACTIVE" : sub.status)} side={sub.status === "PAUSED" ? "Paused" : undefined} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Section title="Order lines" description={`${sub.lines.length} product${sub.lines.length === 1 ? "" : "s"} billed ${period}`}>
            <DataTable columns={lineColumns} rows={lineRows} />
            <div className="mt-5">
              <TotalsPanel totals={totals} label="Total per period" />
            </div>
          </Section>

          <Section title="Invoices" description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} issued`}>
            <DataTable
              columns={invoiceColumns}
              rows={invoiceRows}
              rowHref={(r) => `/invoices/${r.id}`}
              empty={<EmptyState icon={Receipt} title="No invoices yet" description={sub.status === "ACTIVE" ? "Use “Create invoice” to bill the next period." : "Invoices start once the subscription is active."} />}
            />
          </Section>
          {sub.notes && (
            <Section title="Notes">
              <p className="text-sm whitespace-pre-line text-muted-foreground">{sub.notes}</p>
            </Section>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <BillingCard
            title="Billing summary"
            rows={[
              { label: "Next invoice", value: formatDate(sub.nextInvoiceDate) },
              { label: "Start date", value: formatDate(sub.startDate) },
              { label: "Expiry date", value: formatDate(sub.expiryDate) },
              { label: "Billing period", value: humanize(sub.plan.billingPeriod) },
              { label: "Payment terms", value: `${sub.paymentTerms} days` },
              {
                label: "Discount",
                value: sub.discount ? (
                  <span className={totals.discountApplied ? undefined : "text-muted-foreground"}>
                    {sub.discount.name}
                    {!totals.discountApplied && <span className="block text-xs font-normal">{totals.discountReason}</span>}
                  </span>
                ) : (
                  "—"
                ),
              },
              ...(sub.quotationExpiry ? [{ label: "Quote valid until", value: formatDate(sub.quotationExpiry) }] : []),
            ]}
          />
          <section className="card-surface p-5">
            <h2 className="mb-4 text-[15px] font-semibold">Activity</h2>
            <Timeline items={activity(sub, invoiceRows)} />
          </section>
        </div>
      </div>
    </FadeIn>
  );
}

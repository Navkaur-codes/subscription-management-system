import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, humanize } from "@/lib/format";
import { displayStatus } from "@/lib/invoice-status";
import { priceSubscription, toDiscountRule } from "@/lib/subscriptions/pricing";
import { PageHeader, Section } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { DetailList } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { FadeIn, Pulse } from "@/components/motion";
import { StatusStepper } from "@/components/subscriptions/status-stepper";
import { StatusActions } from "@/components/subscriptions/status-actions";
import { TotalsPanel } from "@/components/subscriptions/totals-panel";

export const metadata = { title: "Subscription" };

type LineRow = { id: string; name: string; quantity: number; unitPrice: number; taxRate: number; discount: number; amount: number };
type InvoiceRow = { id: string; number: string; invoiceDate: Date; dueDate: Date; status: string; total: number };

const lineColumns: Column<LineRow>[] = [
  { key: "name", header: "Product", cell: (r) => r.name },
  { key: "qty", header: "Qty", align: "right", cell: (r) => r.quantity },
  { key: "unit", header: "Unit price", align: "right", cell: (r) => formatMoney(r.unitPrice) },
  { key: "disc", header: "Discount", align: "right", cell: (r) => (r.discount ? formatMoney(-r.discount) : "—") },
  { key: "tax", header: "Tax", align: "right", cell: (r) => `${r.taxRate}%` },
  { key: "amount", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
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
    name: l.product.name + (l.variant ? ` · ${l.variant.attribute}: ${l.variant.value}` : ""),
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
    total: Number(inv.total),
  }));

  return (
    <>
      <PageHeader
        title={sub.number}
        description={`${sub.customer.name} · ${sub.plan.name}`}
        actions={<StatusActions id={sub.id} status={sub.status} plan={sub.plan} />}
      />
      <FadeIn className="space-y-6">
        <Section title="Status" actions={<Pulse trigger={sub.status}><StatusBadge status={sub.status} /></Pulse>}>
          <StatusStepper status={sub.status} />
        </Section>

        <Section title="Overview">
          <DetailList
            items={[
              { label: "Customer", value: <Link href={`/customers/${sub.customer.id}`} className="underline-offset-4 hover:underline">{sub.customer.name}</Link> },
              { label: "Plan", value: sub.plan.name },
              { label: "Billing period", value: humanize(sub.plan.billingPeriod) },
              { label: "Start date", value: formatDate(sub.startDate) },
              { label: "Expiry date", value: formatDate(sub.expiryDate) },
              { label: "Next invoice", value: formatDate(sub.nextInvoiceDate) },
              { label: "Payment terms", value: `${sub.paymentTerms} days` },
              { label: "Discount", value: sub.discount ? `${sub.discount.name}${totals.discountApplied ? "" : ` (not applied: ${totals.discountReason})`}` : "—" },
              { label: "Created by", value: sub.createdBy?.name ?? "—" },
              ...(sub.quotationExpiry ? [{ label: "Quotation valid until", value: formatDate(sub.quotationExpiry) }] : []),
              ...(sub.closedAt ? [{ label: "Closed on", value: formatDate(sub.closedAt) }] : []),
            ]}
          />
          {sub.notes && <p className="mt-4 text-sm text-muted-foreground">{sub.notes}</p>}
        </Section>

        <Section title="Order lines" description={`Billed ${sub.plan.billingPeriod.toLowerCase()}`}>
          <DataTable columns={lineColumns} rows={lineRows} />
          <div className="mt-4">
            <TotalsPanel totals={totals} label="Total per period" />
          </div>
        </Section>

        <Section title="Invoices" description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}>
          <DataTable
            columns={invoiceColumns}
            rows={invoiceRows}
            rowHref={(r) => `/invoices/${r.id}`}
            empty={<EmptyState title="No invoices yet" description={sub.status === "ACTIVE" ? "Use “Create invoice” to bill the next period." : "Invoices start once the subscription is active."} />}
          />
        </Section>
      </FadeIn>
    </>
  );
}

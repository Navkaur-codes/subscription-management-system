import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney, humanize, toNum } from "@/lib/format";
import { transitionBlockReason } from "@/lib/subscription-status";
import { portalCustomer } from "@/lib/insights/portal";
import { PageHeader, Section } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { DetailList } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PortalSubActions } from "@/components/insights/portal-sub-actions";

export const metadata = { title: "Subscription" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { customerId } = await portalCustomer();
  const { id } = await params;
  const sub = await db.subscription.findFirst({
    where: { id, customerId },
    include: { plan: true, lines: { include: { product: { select: { name: true } }, variant: true } } },
  });
  if (!sub) notFound();

  const subtotal = sub.lines.reduce((s, l) => s + toNum(l.amount), 0);
  const tax = sub.lines.reduce((s, l) => s + (toNum(l.amount) * toNum(l.taxRate)) / 100, 0);
  const canPause = transitionBlockReason(sub.status, "PAUSED", sub.plan) === null;
  const canResume = transitionBlockReason(sub.status, "ACTIVE", sub.plan) === null && sub.status === "PAUSED";
  const canClose = transitionBlockReason(sub.status, "CLOSED", sub.plan) === null && (sub.status === "ACTIVE" || sub.status === "PAUSED");

  return (
    <div className="space-y-6">
      <PageHeader
        title={sub.number}
        description={sub.plan.name}
        actions={<PortalSubActions id={sub.id} canPause={canPause} canResume={canResume} canClose={canClose} />}
      />
      <Section title="Overview">
        <DetailList
          items={[
            { label: "Status", value: <StatusBadge status={sub.status} /> },
            { label: "Billing", value: humanize(sub.plan.billingPeriod) },
            { label: "Start date", value: formatDate(sub.startDate) },
            { label: "Next invoice", value: formatDate(sub.nextInvoiceDate) },
            { label: "Expiry", value: formatDate(sub.expiryDate) },
            { label: "Payment terms", value: `${sub.paymentTerms} days` },
          ]}
        />
      </Section>
      <div>
<h2 className="mb-3 text-[15px] font-semibold">Items</h2>
        <DataTable
          rows={sub.lines}
          columns={[
            {
              key: "p",
              header: "Product",
              cell: (l) => (
                <span className="font-medium">
                  {l.product.name}
                  {l.variant ? ` · ${l.variant.value}` : ""}
                </span>
              ),
            },
            { key: "q", header: "Qty", align: "right", cell: (l) => l.quantity },
            { key: "u", header: "Unit price", align: "right", cell: (l) => formatMoney(l.unitPrice) },
            { key: "a", header: "Amount", align: "right", cell: (l) => formatMoney(l.amount) },
          ]}
        />
        <dl className="num mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{formatMoney(tax)}</dd>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold">
            <dt>Total per period</dt>
            <dd>{formatMoney(subtotal + tax)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

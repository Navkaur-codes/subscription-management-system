import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { displayStatus, outstanding } from "@/lib/invoice-status";
import { PageHeader, Section } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EditCustomerForm } from "@/components/insights/customer-forms";

export const metadata = { title: "Customer" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const [subs, invoices, totals] = await Promise.all([
    db.subscription.findMany({
      where: { customerId: id },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.invoice.findMany({ where: { customerId: id }, orderBy: { invoiceDate: "desc" }, take: 20 }),
    db.invoice.aggregate({
      where: { customerId: id, status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { total: true, amountPaid: true },
    }),
  ]);
  const paid = toNum(totals._sum.amountPaid);
  const due = Math.max(0, toNum(totals._sum.total) - paid);

  return (
    <div className="space-y-6">
      <PageHeader title={customer.name} description={customer.company ?? customer.email} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Subscriptions" value={subs.length} />
        <StatCard label="Total paid" value={formatMoney(paid)} />
        <StatCard label="Outstanding" value={formatMoney(due)} tone={due > 0 ? "danger" : "default"} />
      </div>
      <EditCustomerForm
        id={id}
        initial={{
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? "",
          company: customer.company ?? "",
          city: customer.city ?? "",
          gstin: customer.gstin ?? "",
          address: customer.address ?? "",
        }}
      />
      <Section title="Subscriptions">
        <DataTable
          rows={subs}
          rowHref={(r) => `/subscriptions/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
            { key: "p", header: "Plan", cell: (r) => r.plan.name },
            { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            { key: "d", header: "Start", cell: (r) => formatDate(r.startDate) },
            { key: "e", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
          ]}
        />
      </Section>
      <Section title="Invoices">
        <DataTable
          rows={invoices}
          rowHref={(r) => `/invoices/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
            { key: "s", header: "Status", cell: (r) => <StatusBadge status={displayStatus(r)} /> },
            { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
            { key: "t", header: "Total", align: "right", cell: (r) => formatMoney(r.total) },
            { key: "o", header: "Outstanding", align: "right", cell: (r) => formatMoney(outstanding(r)) },
          ]}
        />
      </Section>
    </div>
  );
}

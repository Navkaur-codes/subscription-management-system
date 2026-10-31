import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { displayStatus, outstanding } from "@/lib/invoice-status";

import { DataTable } from "@/components/shared/data-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AvatarName } from "@/components/shared/avatar-name";
import { MetricStrip } from "@/components/shared/metric-strip";
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

  const activeSubs = subs.filter((x) => x.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <section className="card-surface flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <AvatarName name={customer.name} sub={[customer.company, customer.email, customer.city].filter(Boolean).join(" · ")} size="lg" />
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">All customers</Link>
          </Button>
        </div>
        <MetricStrip
          className="mb-0 shadow-none"
          items={[
            { label: "Lifetime value", value: formatMoney(paid), hint: "total paid" },
            { label: "Outstanding", value: formatMoney(due) },
            { label: "Active subscriptions", value: activeSubs },
            { label: "Customer since", value: formatDate(customer.createdAt) },
          ]}
        />
      </section>
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
      <div>
<h2 className="mb-3 text-[15px] font-semibold">Subscriptions</h2>
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
      </div>
      <div>
<h2 className="mb-3 text-[15px] font-semibold">Invoices</h2>
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
      </div>
    </div>
  );
}

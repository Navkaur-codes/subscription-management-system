import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { portalCustomer } from "@/lib/insights/portal";
import { PageHeader, Section } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";

export const metadata = { title: "Overview" };

export default async function Page() {
  const { customerId, name } = await portalCustomer();
  const [subs, activeCount, next, due, unpaid] = await Promise.all([
    db.subscription.findMany({
      where: { customerId, status: { in: ["ACTIVE", "PAUSED"] } },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.subscription.count({ where: { customerId, status: "ACTIVE" } }),
    db.subscription.findFirst({
      where: { customerId, status: "ACTIVE", nextInvoiceDate: { not: null } },
      orderBy: { nextInvoiceDate: "asc" },
      select: { nextInvoiceDate: true },
    }),
    db.invoice.aggregate({ where: { customerId, status: "CONFIRMED" }, _sum: { total: true, amountPaid: true } }),
    db.invoice.findMany({ where: { customerId, status: "CONFIRMED" }, orderBy: { dueDate: "asc" }, take: 5 }),
  ]);
  const amountDue = Math.max(0, toNum(due._sum.total) - toNum(due._sum.amountPaid));

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${name.split(" ")[0]}`} description="Your subscriptions and invoices." />
      <Stagger className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active subscriptions" value={activeCount} />
        <StatCard label="Next invoice date" value={formatDate(next?.nextInvoiceDate)} />
        <StatCard label="Amount due" value={formatMoney(amountDue)} tone={amountDue > 0 ? "danger" : "default"} />
      </Stagger>
      <Section title="Current subscriptions" actions={<Link href="/portal/subscriptions" className="text-xs text-brand">View all</Link>}>
        <DataTable
          rows={subs}
          rowHref={(r) => `/portal/subscriptions/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
            { key: "p", header: "Plan", cell: (r) => r.plan.name },
            { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            { key: "x", header: "Next invoice", cell: (r) => formatDate(r.nextInvoiceDate) },
          ]}
        />
      </Section>
      <Section title="Unpaid invoices" actions={<Link href="/portal/invoices" className="text-xs text-brand">View all</Link>}>
        <DataTable
          rows={unpaid}
          rowHref={(r) => `/portal/invoices/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
            { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
            { key: "o", header: "Amount due", align: "right", cell: (r) => formatMoney(outstanding(r)) },
          ]}
        />
      </Section>
    </div>
  );
}

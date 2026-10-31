import Link from "next/link";
import { CalendarCheck, CalendarClock, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { portalCustomer } from "@/lib/insights/portal";
import { DataTable } from "@/components/shared/data-table";
import { KpiCard } from "@/components/shared/kpi-card";
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
    <div className="space-y-8">
      <section className="bg-brand-gradient bg-grid rounded-2xl p-6 text-white shadow-card sm:p-8">
        <p className="text-xs font-medium tracking-wider text-white/70 uppercase">Customer portal</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">Hello, {name.split(" ")[0]}</h1>
        <p className="mt-1.5 text-sm text-white/80">Manage your subscriptions and keep track of your invoices.</p>
      </section>
      <Stagger className="grid gap-6 sm:grid-cols-3">
        <KpiCard label="Active subscriptions" icon={CalendarCheck} value={activeCount} />
        <KpiCard label="Next invoice date" icon={CalendarClock} tone="info" value={formatDate(next?.nextInvoiceDate)} />
        <KpiCard label="Amount due" icon={Wallet} tone={amountDue > 0 ? "danger" : "success"} value={formatMoney(amountDue)} />
      </Stagger>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Current subscriptions</h2>
          <Link href="/portal/subscriptions" className="text-xs font-medium text-brand">View all</Link>
        </div>
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
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Unpaid invoices</h2>
          <Link href="/portal/invoices" className="text-xs font-medium text-brand">View all</Link>
        </div>
        <DataTable
          rows={unpaid}
          rowHref={(r) => `/portal/invoices/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
            { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
            { key: "o", header: "Amount due", align: "right", cell: (r) => formatMoney(outstanding(r)) },
          ]}
        />
      </div>
    </div>
  );
}

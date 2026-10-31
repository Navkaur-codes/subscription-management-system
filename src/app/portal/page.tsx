import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { portalCustomer } from "@/lib/insights/portal";
import { DataTable } from "@/components/shared/data-table";
import { KpiStrip } from "@/components/insights/kpi-strip";
import { DashboardHero } from "@/components/insights/dashboard-hero";
import { StatusBadge } from "@/components/shared/status-badge";
import { Orbit, ScrambleNumber, Stagger } from "@/components/motion";

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
      <DashboardHero
        eyebrow="Customer portal"
        headline={
          <>
            Hello {name.split(" ")[0]} — {next?.nextInvoiceDate ? <>your plan <em>renews</em> on {formatDate(next.nextInvoiceDate)}</> : <>nothing <em>due</em> soon</>}
          </>
        }
        orbit={<Orbit size={180} dots={3} />}
        sub={`${activeCount} active subscription${activeCount === 1 ? "" : "s"} · ${formatMoney(amountDue)} currently due`}
      />
      <Stagger>
        <KpiStrip
          cells={[
            { label: "Active subscriptions", value: <ScrambleNumber value={activeCount} /> },
            { label: "Next invoice date", value: formatDate(next?.nextInvoiceDate) },
            { label: "Amount due", value: formatMoney(amountDue), danger: amountDue > 0 },
          ]}
        />
      </Stagger>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">Current <em>subscriptions</em></h2>
          <Link href="/portal/subscriptions" className="text-xs font-medium text-ember">View all</Link>
        </div>
        <DataTable
          rows={subs}
          rowHref={(r) => `/portal/subscriptions/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-mono-num">{r.number}</span> },
            { key: "p", header: "Plan", cell: (r) => r.plan.name },
            { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            { key: "x", header: "Next invoice", cell: (r) => formatDate(r.nextInvoiceDate) },
          ]}
        />
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">Unpaid <em>invoices</em></h2>
          <Link href="/portal/invoices" className="text-xs font-medium text-ember">View all</Link>
        </div>
        <DataTable
          rows={unpaid}
          rowHref={(r) => `/portal/invoices/${r.id}`}
          columns={[
            { key: "n", header: "Number", cell: (r) => <span className="font-mono-num">{r.number}</span> },
            { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
            { key: "o", header: "Amount due", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(outstanding(r))}</span> },
          ]}
        />
      </div>
    </div>
  );
}

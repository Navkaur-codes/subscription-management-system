import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney, humanize } from "@/lib/format";
import { displayStatus, outstanding } from "@/lib/invoice-status";
import {
  invoiceInclude,
  invoiceWhere,
  parseFilters,
  paymentInclude,
  paymentWhere,
  reportSummary,
  subscriptionInclude,
  subscriptionWhere,
} from "@/lib/insights/reports";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/list-controls";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";
import { ReportFilters } from "@/components/insights/report-filters";

export const metadata = { title: "Reports" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const { page, skip, take } = pageParams(sp);

  const [plans, summary] = await Promise.all([
    db.plan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    reportSummary(f),
  ]);

  let table: React.ReactNode;
  let total = 0;
  if (f.view === "subscriptions") {
    const where = subscriptionWhere(f);
    const [rows, count] = await Promise.all([
      db.subscription.findMany({ where, include: subscriptionInclude, orderBy: { createdAt: "desc" }, skip, take }),
      db.subscription.count({ where }),
    ]);
    total = count;
    table = (
      <DataTable
        rows={rows}
        rowHref={(r) => `/subscriptions/${r.id}`}
        columns={[
          { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
          { key: "c", header: "Customer", cell: (r) => r.customer.name },
          { key: "p", header: "Plan", cell: (r) => r.plan.name },
          { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          { key: "st", header: "Start", cell: (r) => formatDate(r.startDate) },
          { key: "e", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
        ]}
      />
    );
  } else if (f.view === "invoices") {
    const where = invoiceWhere(f);
    const [rows, count] = await Promise.all([
      db.invoice.findMany({ where, include: invoiceInclude, orderBy: { invoiceDate: "desc" }, skip, take }),
      db.invoice.count({ where }),
    ]);
    total = count;
    table = (
      <DataTable
        rows={rows}
        rowHref={(r) => `/invoices/${r.id}`}
        columns={[
          { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
          { key: "c", header: "Customer", cell: (r) => r.customer.name },
          { key: "s", header: "Status", cell: (r) => <StatusBadge status={displayStatus(r)} /> },
          { key: "d", header: "Invoice date", cell: (r) => formatDate(r.invoiceDate) },
          { key: "due", header: "Due", cell: (r) => formatDate(r.dueDate) },
          { key: "t", header: "Total", align: "right", cell: (r) => formatMoney(r.total) },
          { key: "o", header: "Outstanding", align: "right", cell: (r) => formatMoney(outstanding(r)) },
        ]}
      />
    );
  } else {
    const where = paymentWhere(f);
    const [rows, count] = await Promise.all([
      db.payment.findMany({ where, include: paymentInclude, orderBy: { paymentDate: "desc" }, skip, take }),
      db.payment.count({ where }),
    ]);
    total = count;
    table = (
      <DataTable
        rows={rows}
        rowHref={(r) => `/invoices/${r.invoice.id}`}
        columns={[
          { key: "d", header: "Date", cell: (r) => formatDate(r.paymentDate) },
          { key: "i", header: "Invoice", cell: (r) => <span className="font-medium">{r.invoice.number}</span> },
          { key: "c", header: "Customer", cell: (r) => r.invoice.customer.name },
          { key: "m", header: "Method", cell: (r) => humanize(r.method) },
          { key: "r", header: "Reference", cell: (r) => r.reference ?? "—" },
          { key: "a", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Filter, summarise and export subscriptions, invoices and payments." />
      <div>
        <ReportFilters view={f.view} plans={plans} />
        <Stagger className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </Stagger>
        <Stagger>{table}</Stagger>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}

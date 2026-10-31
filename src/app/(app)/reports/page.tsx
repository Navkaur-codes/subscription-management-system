import { BarChart3 } from "lucide-react";
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
  reportChart,
  reportSummary,
  subscriptionInclude,
  subscriptionWhere,
} from "@/lib/insights/reports";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/list-controls";
import { MetricStrip } from "@/components/shared/metric-strip";
import { ChartCard } from "@/components/shared/chart-card";
import { AreaTrend, BarTrend } from "@/components/shared/charts";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";
import { ReportFilters } from "@/components/insights/report-filters";

export const metadata = { title: "Reports" };

const CHART = {
  subscriptions: { title: "New subscriptions by month", bars: [] },
  invoices: {
    title: "Invoiced vs paid by month",
    bars: [
      { key: "a", label: "Invoiced" },
      { key: "b", label: "Paid" },
    ],
  },
  payments: { title: "Payments collected by month", bars: [{ key: "a", label: "Collected" }] },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const f = parseFilters(sp);
  const { page, skip, take } = pageParams(sp);

  const [plans, summary, chart] = await Promise.all([
    db.plan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    reportSummary(f),
    reportChart(f.view),
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
          { key: "n", header: "Number", cell: (r) => <span className="font-mono-num">{r.number}</span> },
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
          { key: "n", header: "Number", cell: (r) => <span className="font-mono-num">{r.number}</span> },
          { key: "c", header: "Customer", cell: (r) => r.customer.name },
          { key: "s", header: "Status", cell: (r) => <StatusBadge status={displayStatus(r)} /> },
          { key: "d", header: "Invoice date", cell: (r) => formatDate(r.invoiceDate) },
          { key: "due", header: "Due", cell: (r) => formatDate(r.dueDate) },
          { key: "t", header: "Total", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(r.total)}</span> },
          { key: "o", header: "Outstanding", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(outstanding(r))}</span> },
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
          { key: "a", header: "Amount", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(r.amount)}</span> },
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insights" icon={BarChart3} title="Reports" description="Filter, summarise and export subscriptions, invoices and payments." />
      <div>
        <ReportFilters view={f.view} plans={plans} />
        <MetricStrip items={summary} className="mb-4" />
        <ChartCard title={CHART[f.view].title} description="Last 12 months, all records" className="mb-6">
          {f.view === "subscriptions" ? (
            <AreaTrend data={chart} xKey="label" yKey="a" label="New subscriptions" />
          ) : (
            <BarTrend data={chart} xKey="label" format="money" bars={CHART[f.view].bars} />
          )}
        </ChartCard>
        <Stagger>{table}</Stagger>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}

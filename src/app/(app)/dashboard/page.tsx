import Link from "next/link";
import { AlertTriangle, CalendarCheck, IndianRupee, Repeat, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { dashboardMetrics } from "@/lib/insights/metrics";
import { PageHeader, Section } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { CountUp, Stagger } from "@/components/motion";
import { MoneyCount } from "@/components/insights/kpi-money";
import { RevenueBars, StatusBars } from "@/components/insights/bars";

export const metadata = { title: "Dashboard" };

export default async function Page() {
  await requireRole("ADMIN", "STAFF");
  const m = await dashboardMetrics();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Subscriptions, revenue and collections at a glance." />
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active subscriptions" icon={<CalendarCheck />} value={<CountUp value={m.active} />} />
        <StatCard label="Recurring revenue / month" icon={<Repeat />} value={<MoneyCount value={m.mrr} />} />
        <StatCard label="Collected this month" icon={<IndianRupee />} value={<MoneyCount value={m.collected} />} />
        <StatCard label="Outstanding" icon={<Wallet />} value={<MoneyCount value={m.outstanding} />} />
        <StatCard
          label="Overdue invoices"
          icon={<AlertTriangle />}
          tone="danger"
          value={<CountUp value={m.overdueCount} />}
          hint={formatMoney(m.overdueAmount)}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Overdue invoices" description="Oldest first">
          <DataTable
            rows={m.overdueList}
            rowHref={(r) => `/invoices/${r.id}`}
            columns={[
              { key: "n", header: "Invoice", cell: (r) => <span className="font-medium">{r.number}</span> },
              { key: "c", header: "Customer", cell: (r) => r.customer.name },
              { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
              { key: "o", header: "Outstanding", align: "right", cell: (r) => formatMoney(outstanding(r)) },
            ]}
          />
        </Section>
        <Section title="Recent payments">
          <DataTable
            rows={m.recentPayments}
            columns={[
              {
                key: "n",
                header: "Invoice",
                cell: (r) => (
                  <Link href={`/invoices/${r.invoice.id}`} className="font-medium">
                    {r.invoice.number}
                  </Link>
                ),
              },
              { key: "c", header: "Customer", cell: (r) => r.invoice.customer.name },
              { key: "d", header: "Date", cell: (r) => formatDate(r.paymentDate) },
              { key: "a", header: "Amount", align: "right", cell: (r) => formatMoney(toNum(r.amount)) },
            ]}
          />
        </Section>
        <Section title="Subscriptions by status">
          <StatusBars items={m.statuses} />
        </Section>
        <Section title="Revenue last 6 months" description="Payments received">
          <RevenueBars items={m.revenue} />
        </Section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, ArrowRight, CalendarCheck, IndianRupee, Repeat, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, humanize, toNum } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { dashboardMetrics } from "@/lib/insights/metrics";
import { ChartCard } from "@/components/shared/chart-card";
import { KpiCard } from "@/components/shared/kpi-card";
import { AvatarName } from "@/components/shared/avatar-name";
import { DataTable } from "@/components/shared/data-table";
import { AreaTrend, BarTrend, Donut } from "@/components/shared/charts";
import { Button } from "@/components/ui/button";
import { CountUp, Stagger } from "@/components/motion";
import { MoneyCount } from "@/components/insights/kpi-money";
import { shortMoney } from "@/lib/insights/money";
import { PlanBars } from "@/components/insights/bars";

export const metadata = { title: "Dashboard" };

function greeting(h: number) {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Page() {
  const user = await requireRole("ADMIN", "STAFF");
  const m = await dashboardMetrics();
  const now = new Date();
  const statusTotal = m.statuses.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-8">
      <section className="bg-brand-gradient bg-grid relative overflow-hidden rounded-2xl p-6 text-white shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-white/70 uppercase">{format(now, "EEEE, dd MMMM yyyy")}</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting(now.getHours())}, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1.5 text-sm text-white/80">
              {m.active.toLocaleString("en-IN")} active subscriptions · {m.overdueCount.toLocaleString("en-IN")} invoices need attention
            </p>
          </div>
          <Button asChild variant="secondary" className="self-start sm:self-auto">
            <Link href="/invoices">
              Generate due invoices <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Stagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active subscriptions"
          icon={CalendarCheck}
          value={<CountUp value={m.active} />}
          delta={m.deltas.active}
          deltaLabel="vs last month"
          trend={m.trends.active}
        />
        <KpiCard
          label="Recurring revenue / month"
          icon={Repeat}
          tone="info"
          value={<MoneyCount value={m.mrr} />}
          delta={m.deltas.mrr}
          deltaLabel="vs last month"
          trend={m.trends.mrr}
        />
        <KpiCard
          label="Collected this month"
          icon={IndianRupee}
          tone="success"
          value={<MoneyCount value={m.collected} />}
          delta={m.deltas.collected}
          deltaLabel="vs last month"
          trend={m.trends.collected}
        />
        <KpiCard label="Outstanding" icon={Wallet} tone="warning" value={<MoneyCount value={m.outstanding} />} trend={m.trends.outstanding} />
        <KpiCard
          label="Overdue invoices"
          icon={AlertTriangle}
          tone="danger"
          value={<CountUp value={m.overdueCount} />}
          deltaLabel={shortMoney(m.overdueAmount)}
          trend={m.trends.overdue}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Recurring revenue (MRR)" description="Last 12 months" className="lg:col-span-2">
          <AreaTrend data={m.mrrTrend} xKey="label" yKey="value" label="MRR" format="money" />
        </ChartCard>
        <ChartCard title="Subscriptions by status" description={`${statusTotal.toLocaleString("en-IN")} in total`}>
          <Donut
            data={m.statuses.map((s) => ({ name: humanize(s.status), value: s.count }))}
            centerLabel="Total"
            centerValue={statusTotal.toLocaleString("en-IN")}
          />
        </ChartCard>
        <ChartCard title="Invoiced vs collected" description="Last 6 months" className="lg:col-span-2">
          <BarTrend
            data={m.invoicedVsCollected}
            xKey="label"
            format="money"
            bars={[
              { key: "invoiced", label: "Invoiced" },
              { key: "collected", label: "Collected" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Top plans by revenue" description="Monthly recurring revenue">
          <PlanBars items={m.planMrr} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-[15px] font-semibold">Overdue invoices</h2>
          <DataTable
            rows={m.overdueList}
            rowHref={(r) => `/invoices/${r.id}`}
            columns={[
              { key: "c", header: "Customer", cell: (r) => <AvatarName name={r.customer.name} sub={r.number} size="sm" /> },
              { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
              { key: "o", header: "Outstanding", align: "right", cell: (r) => formatMoney(outstanding(r)) },
            ]}
          />
        </div>
        <div>
          <h2 className="mb-3 text-[15px] font-semibold">Recent payments</h2>
          <DataTable
            rows={m.recentPayments}
            rowHref={(r) => `/invoices/${r.invoice.id}`}
            columns={[
              { key: "c", header: "Customer", cell: (r) => <AvatarName name={r.invoice.customer.name} sub={r.invoice.number} size="sm" /> },
              { key: "d", header: "Date", cell: (r) => formatDate(r.paymentDate) },
              { key: "a", header: "Amount", align: "right", cell: (r) => formatMoney(toNum(r.amount)) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

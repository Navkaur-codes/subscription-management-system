import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, humanize } from "@/lib/format";
import { outstanding } from "@/lib/invoice-status";
import { dashboardMetrics } from "@/lib/insights/metrics";
import { shortMoney } from "@/lib/insights/money";
import { ChartCard } from "@/components/shared/chart-card";
import { AvatarName } from "@/components/shared/avatar-name";
import { DataTable } from "@/components/shared/data-table";
import { AreaTrend, BarTrend, Donut } from "@/components/shared/charts";
import { Magnetic, Orbit, ScrambleNumber, Stagger, Ticker } from "@/components/motion";
import { MoneyCount } from "@/components/insights/kpi-money";
import { KpiStrip } from "@/components/insights/kpi-strip";
import { DashboardHero } from "@/components/insights/dashboard-hero";
import { PlanBars } from "@/components/insights/bars";

export const metadata = { title: "Dashboard" };

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display mb-3 text-2xl">{children}</h2>;
}

export default async function Page() {
  const user = await requireRole("ADMIN", "STAFF");
  const m = await dashboardMetrics();
  const now = new Date();
  const statusTotal = m.statuses.reduce((s, x) => s + x.count, 0);
  const trend = m.deltas.mrr;

  return (
    <div className="space-y-10">
      <DashboardHero
        eyebrow={`${format(now, "EEE, dd MMM yyyy")} / ${user.name.split(" ")[0]}`}
        headline={
          <>
            {shortMoney(m.mrr)} in <em>recurring</em> revenue
          </>
        }
        sub={
          <>
            {trend !== undefined ? `${trend >= 0 ? "Up" : "Down"} ${Math.abs(trend)}% this month · ` : ""}
            {m.overdueCount.toLocaleString("en-IN")} invoices need attention · {m.active.toLocaleString("en-IN")} active subscriptions
          </>
        }
        orbit={<Orbit size={220} dots={4} />}
        ticker={
          m.ticker.length > 0 ? (
            <Ticker items={m.ticker.map((t) => <span key={t} className="font-mono-num px-6 text-xs">{t}</span>)} />
          ) : undefined
        }
        actions={
          <>
            <Magnetic>
              <Button asChild className="bg-ember text-white hover:bg-ember/90">
                <Link href="/invoices">
                  Run billing <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild variant="outline" className="border-paper/25 bg-transparent text-paper hover:bg-paper/10 hover:text-paper">
              <Link href="/subscriptions/new">
                <Plus className="size-4" /> New subscription
              </Link>
            </Button>
          </>
        }
      />

      <Stagger>
        <KpiStrip
          cells={[
            {
              label: "Active subscriptions",
              value: <ScrambleNumber value={m.active} />,
              delta: m.deltas.active,
              hint: "vs last month",
              trend: m.trends.active,
            },
            {
              label: "Recurring / month",
              value: <MoneyCount value={m.mrr} />,
              delta: m.deltas.mrr,
              hint: "vs last month",
              trend: m.trends.mrr,
            },
            {
              label: "Collected this month",
              value: <MoneyCount value={m.collected} />,
              delta: m.deltas.collected,
              hint: "vs last month",
              trend: m.trends.collected,
            },
            { label: "Outstanding", value: <MoneyCount value={m.outstanding} />, trend: m.trends.outstanding },
            {
              label: "Overdue invoices",
              value: <ScrambleNumber value={m.overdueCount} />,
              hint: shortMoney(m.overdueAmount),
              trend: m.trends.overdue,
              danger: true,
            },
          ]}
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Recurring revenue" description="MRR, last 12 months" className="lg:col-span-2">
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
        <ChartCard title="Top plans" description="Monthly recurring revenue">
          <PlanBars items={m.planMrr} />
        </ChartCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Heading>
            Overdue <em>invoices</em>
          </Heading>
          <DataTable
            rows={m.overdueList}
            rowHref={(r) => `/invoices/${r.id}`}
            columns={[
              { key: "c", header: "Customer", cell: (r) => <AvatarName name={r.customer.name} sub={r.number} size="sm" /> },
              { key: "d", header: "Due", cell: (r) => formatDate(r.dueDate) },
              { key: "o", header: "Outstanding", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(outstanding(r))}</span> },
            ]}
          />
        </div>
        <div>
          <Heading>
            Recent <em>payments</em>
          </Heading>
          <DataTable
            rows={m.recentPayments}
            rowHref={(r) => `/invoices/${r.invoice.id}`}
            columns={[
              { key: "c", header: "Customer", cell: (r) => <AvatarName name={r.invoice.customer.name} sub={r.invoice.number} size="sm" /> },
              { key: "d", header: "Date", cell: (r) => formatDate(r.paymentDate) },
              { key: "a", header: "Amount", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(r.amount)}</span> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

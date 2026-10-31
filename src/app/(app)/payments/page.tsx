import Link from "next/link";
import { Banknote, CreditCard, Hash, Wallet } from "lucide-react";
import { addMonths, startOfMonth } from "date-fns";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney, round2, toNum } from "@/lib/format";
import { dateFilter, str } from "@/lib/billing/filters";
import { METHOD_LABEL, PAYMENT_METHODS } from "@/lib/validators/billing";
import { ChartCard, PageHeader } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { KpiCard, KpiStrip } from "@/components/shared/stat-card";
import { AvatarName } from "@/components/shared/display";
import { Stagger } from "@/components/motion";
import { DateRange } from "@/components/billing/date-range";
import { MethodBreakdown } from "@/components/billing/method-breakdown";

export const metadata = { title: "Payments" };

const TABS = [{ value: "", label: "All" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))];
const TREND_MONTHS = 6;

const rowSelect = {
  id: true,
  paymentDate: true,
  method: true,
  amount: true,
  note: true,
  reference: true,
  invoice: { select: { id: true, number: true, customer: { select: { name: true } } } },
} satisfies Prisma.PaymentSelect;
type Row = Prisma.PaymentGetPayload<{ select: typeof rowSelect }>;

const columns: Column<Row>[] = [
  { key: "customer", header: "Customer", cell: (r) => <AvatarName name={r.invoice.customer.name} sub={formatDate(r.paymentDate)} size="sm" /> },
  {
    key: "invoice",
    header: "Invoice",
    cell: (r) => (
      <Link href={`/invoices/${r.invoice.id}`} className="font-mono-num hover:text-ember hover:underline">
        {r.invoice.number}
      </Link>
    ),
  },
  { key: "method", header: "Method", cell: (r) => METHOD_LABEL[r.method] },
  {
    key: "ref",
    header: "Reference",
    cell: (r) => [r.reference, r.note].filter(Boolean).join(" · ") || "—",
    className: "hidden max-w-56 truncate text-muted-foreground md:table-cell",
  },
  { key: "amount", header: "Amount", align: "right", cell: (r) => <span className="font-mono-num font-medium">{formatMoney(r.amount)}</span> },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const q = str(sp.q);
  const methodParam = str(sp.method);
  const method = PAYMENT_METHODS.find((m) => m === methodParam) as PaymentMethod | undefined;
  const paymentDate = dateFilter(str(sp.from), str(sp.to));

  const where: Prisma.PaymentWhereInput = {
    ...(method ? { method } : {}),
    ...(paymentDate ? { paymentDate } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { invoice: { number: { contains: q, mode: "insensitive" } } },
            { invoice: { customer: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  // month buckets oldest → current, for the KPI sparkline and month-over-month delta
  const thisMonth = startOfMonth(new Date());
  const months = Array.from({ length: TREND_MONTHS }, (_, i) => addMonths(thisMonth, i - (TREND_MONTHS - 1)));

  const [rows, count, sum, byMethod, monthly, monthCount] = await Promise.all([
    db.payment.findMany({ where, select: rowSelect, orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }], skip, take }),
    db.payment.count({ where }),
    db.payment.aggregate({ where, _sum: { amount: true } }),
    db.payment.groupBy({ by: ["method"], where, _sum: { amount: true } }),
    Promise.all(
      months.map((m) =>
        db.payment.aggregate({ where: { paymentDate: { gte: m, lt: addMonths(m, 1) } }, _sum: { amount: true } })
      )
    ),
    db.payment.count({ where: { paymentDate: { gte: thisMonth } } }),
  ]);

  const trend = monthly.map((m) => toNum(m._sum.amount ?? 0));
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];
  const delta = previous > 0 ? round2(((current - previous) / previous) * 100) : undefined;
  const totalAll = toNum(sum._sum.amount ?? 0);
  const methods = byMethod
    .map((b) => ({ name: METHOD_LABEL[b.method], value: toNum(b._sum.amount ?? 0) }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const top = methods[0];
  const filtered = Boolean(method || paymentDate || q);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Billing / 04" icon={Wallet} title="Payments" description="Every payment recorded against an invoice. Register new payments from the invoice." />

      <Stagger>
        <KpiStrip>
          <KpiCard label="Collected this month" numeric={{ value: current, format: "compact-money" }} icon={Banknote} delta={delta} deltaLabel="vs last month" trend={trend} tone="success" />
          <KpiCard label="Payments this month" numeric={{ value: monthCount, format: "number" }} icon={Hash} deltaLabel={`since ${formatDate(thisMonth)}`} />
          <KpiCard
            label={filtered ? "Received in view" : "Received, all time"}
            numeric={{ value: totalAll, format: "compact-money" }}
            icon={Wallet}
            deltaLabel={`${count.toLocaleString("en-IN")} payments`}
          />
          <KpiCard
            label="Average payment"
            numeric={{ value: count > 0 ? totalAll / count : 0, format: "compact-money" }}
            icon={CreditCard}
            deltaLabel={top && totalAll > 0 ? `${top.name} leads · ${Math.round((top.value / totalAll) * 100)}%` : undefined}
          />
        </KpiStrip>
      </Stagger>

      <ChartCard title="By method" description={filtered ? "Share of amount received in the current view" : "Share of all amount received"}>
        <MethodBreakdown rows={methods} total={totalAll} />
      </ChartCard>

      <div>
        <div className="mb-3 max-w-full overflow-x-auto [scrollbar-width:none]">
          <FilterTabs param="method" options={TABS} />
        </div>
        <Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search invoice, customer, reference…" />
            <DateRange />
          </div>
        </Toolbar>
        <DataTable columns={columns} rows={rows} empty={<EmptyState icon={Wallet} title="No payments" description="Nothing matches these filters." />} />
        <Pagination page={page} pageSize={PAGE_SIZE} total={count} />
      </div>
    </div>
  );
}

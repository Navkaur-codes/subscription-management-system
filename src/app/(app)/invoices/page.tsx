import { FileText } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { displayStatus, isOverdue, outstanding, overdueWhere } from "@/lib/invoice-status";
import { formatDate, formatMoney, round2, toNum } from "@/lib/format";
import { dateFilter, formatRupees, str } from "@/lib/billing/filters";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { AvatarName, MetricStrip } from "@/components/shared/display";
import { DateRange } from "@/components/billing/date-range";
import { BillingRunDialog } from "@/components/billing/billing-run-dialog";
import { generateDueAction, previewBillingAction } from "./actions";

export const metadata = { title: "Invoices" };

const TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "outstanding", label: "Outstanding" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
] as const;
type Tab = (typeof TABS)[number]["value"];

// Outstanding = CONFIRMED (payments flip an invoice to PAID once amountPaid ≥ total).
function statusWhere(s?: string): Prisma.InvoiceWhereInput {
  switch (s) {
    case "draft":
      return { status: "DRAFT" };
    case "confirmed":
    case "outstanding":
      return { status: "CONFIRMED" };
    case "overdue":
      return overdueWhere();
    case "paid":
      return { status: "PAID" };
    case "cancelled":
      return { status: "CANCELLED" };
    default:
      return {};
  }
}

const rowSelect = {
  id: true,
  number: true,
  status: true,
  invoiceDate: true,
  dueDate: true,
  periodStart: true,
  periodEnd: true,
  total: true,
  amountPaid: true,
  customer: { select: { name: true } },
  subscription: { select: { number: true } },
} satisfies Prisma.InvoiceSelect;
type Row = Prisma.InvoiceGetPayload<{ select: typeof rowSelect }>;

function numberCell(r: Row) {
  const late = isOverdue(r) ? differenceInCalendarDays(new Date(), r.dueDate) : 0;
  return (
    <span className="flex items-center gap-3">
      <span className={late ? "h-8 w-0.5 rounded-full bg-danger" : "h-8 w-0.5"} aria-hidden />
      <span className="flex flex-col">
        <span className="font-mono-num font-medium">{r.number}</span>
        <span className={late ? "text-xs text-danger" : "text-xs text-muted-foreground"}>
          {late
            ? `${late} day${late === 1 ? "" : "s"} overdue`
            : r.periodStart && r.periodEnd
              ? `${formatDate(r.periodStart)} – ${formatDate(r.periodEnd)}`
              : "One-off"}
        </span>
      </span>
    </span>
  );
}

const columns: Column<Row>[] = [
  { key: "number", header: "Invoice", cell: numberCell },
  { key: "customer", header: "Customer", cell: (r) => <AvatarName name={r.customer.name} sub={r.subscription && <span className="font-mono-num">{r.subscription.number}</span>} size="sm" /> },
  { key: "date", header: "Issued", cell: (r) => formatDate(r.invoiceDate), className: "hidden md:table-cell" },
  { key: "due", header: "Due", cell: (r) => formatDate(r.dueDate), className: "hidden md:table-cell" },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={displayStatus(r)} /> },
  { key: "total", header: "Total", align: "right", cell: (r) => formatMoney(r.total), className: "font-mono-num" },
  { key: "outstanding", header: "Balance", align: "right", cell: (r) => formatMoney(outstanding(r)), className: "font-mono-num hidden sm:table-cell" },
];

const mono = (v: string) => <span className="font-mono-num">{v}</span>;

type Sums = { _sum: { total: Prisma.Decimal | null; amountPaid: Prisma.Decimal | null } };
const open = (a: Sums) => round2(toNum(a._sum.total ?? 0) - toNum(a._sum.amountPaid ?? 0));

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const q = str(sp.q);
  const status = str(sp.status);
  const invoiceDate = dateFilter(str(sp.from), str(sp.to));

  // base = search + date range; tabs count against it, the table/metrics add the status filter
  const base: Prisma.InvoiceWhereInput = {
    ...(invoiceDate ? { invoiceDate } : {}),
    ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { customer: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const where: Prisma.InvoiceWhereInput = { AND: [base, statusWhere(status)] };
  const sum = { _sum: { total: true, amountPaid: true } } as const;

  const [rows, count, byStatus, overdueCount, billed, confirmed, overdue] = await Promise.all([
    db.invoice.findMany({ where, select: rowSelect, orderBy: [{ invoiceDate: "desc" }, { number: "desc" }], skip, take }),
    db.invoice.count({ where }),
    db.invoice.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
    db.invoice.count({ where: { AND: [base, overdueWhere()] } }),
    db.invoice.aggregate({ where: { AND: [where, { status: { not: "CANCELLED" } }] }, ...sum }),
    db.invoice.aggregate({ where: { AND: [where, { status: "CONFIRMED" }] }, ...sum }),
    db.invoice.aggregate({ where: { AND: [where, overdueWhere()] }, ...sum }),
  ]);

  const n = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const counts: Record<Tab, number> = {
    "": byStatus.reduce((a, b) => a + b._count._all, 0),
    draft: n("DRAFT"),
    outstanding: n("CONFIRMED"),
    overdue: overdueCount,
    paid: n("PAID"),
    cancelled: n("CANCELLED"),
  };
  const tabs = TABS.map((t) => ({ value: t.value, label: `${t.label} ${counts[t.value].toLocaleString("en-IN")}` }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Billing / 03"
        icon={FileText}
        title="Invoices"
        description="Generated from subscriptions and billed exactly once per period."
        actions={<BillingRunDialog preview={previewBillingAction} run={generateDueAction} />}
      />
      <MetricStrip
        items={[
          { label: "Invoiced", value: mono(formatRupees(billed._sum.total)), hint: `${count.toLocaleString("en-IN")} invoices` },
          { label: "Collected", value: mono(formatRupees(billed._sum.amountPaid)) },
          { label: "Outstanding", value: mono(formatRupees(open(confirmed))) },
          { label: "Overdue", value: mono(formatRupees(open(overdue))), hint: "Past due date, unpaid" },
        ]}
      />
      <div>
        <div className="mb-3 max-w-full overflow-x-auto [scrollbar-width:none]">
          <FilterTabs param="status" options={tabs} />
        </div>
        <Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search number or customer…" />
            <DateRange />
          </div>
        </Toolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowHref={(r) => `/invoices/${r.id}`}
          empty={<EmptyState icon={FileText} title="No invoices" description="Nothing matches these filters." />}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={count} />
      </div>
    </div>
  );
}

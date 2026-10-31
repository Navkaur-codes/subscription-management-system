import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { displayStatus, outstanding, overdueWhere } from "@/lib/invoice-status";
import { formatDate, formatMoney, round2, toNum } from "@/lib/format";
import { dateFilter, str } from "@/lib/billing/filters";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { ActionButton } from "@/components/shared/action-button";
import { Stagger } from "@/components/motion";
import { DateRange } from "@/components/billing/date-range";
import { generateDueAction } from "./actions";

export const metadata = { title: "Invoices" };

const TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "outstanding", label: "Outstanding" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

function statusWhere(s?: string): Prisma.InvoiceWhereInput {
  switch (s) {
    case "draft":
      return { status: "DRAFT" };
    case "confirmed":
      return { status: "CONFIRMED" };
    case "outstanding": // stored amountPaid < total ⇔ status still CONFIRMED (payments flip to PAID when settled)
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
  total: true,
  amountPaid: true,
  customer: { select: { name: true } },
  subscription: { select: { id: true, number: true } },
} satisfies Prisma.InvoiceSelect;
type Row = Prisma.InvoiceGetPayload<{ select: typeof rowSelect }>;

const columns: Column<Row>[] = [
  { key: "number", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
  { key: "customer", header: "Customer", cell: (r) => r.customer.name },
  {
    key: "subscription",
    header: "Subscription",
    cell: (r) =>
      r.subscription ? (
        <Link href={`/subscriptions/${r.subscription.id}`} className="text-muted-foreground hover:text-foreground hover:underline">
          {r.subscription.number}
        </Link>
      ) : (
        "—"
      ),
  },
  { key: "date", header: "Invoice date", cell: (r) => formatDate(r.invoiceDate) },
  { key: "due", header: "Due date", cell: (r) => formatDate(r.dueDate) },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={displayStatus(r)} /> },
  { key: "total", header: "Total", align: "right", cell: (r) => formatMoney(r.total) },
  { key: "outstanding", header: "Outstanding", align: "right", cell: (r) => formatMoney(outstanding(r)) },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const q = str(sp.q);
  const invoiceDate = dateFilter(str(sp.from), str(sp.to));

  const where: Prisma.InvoiceWhereInput = {
    ...statusWhere(str(sp.status)),
    ...(invoiceDate ? { invoiceDate } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const openWhere: Prisma.InvoiceWhereInput = { AND: [where, { status: "CONFIRMED" }] };

  const [rows, count, sums, open] = await Promise.all([
    db.invoice.findMany({ where, select: rowSelect, orderBy: [{ invoiceDate: "desc" }, { number: "desc" }], skip, take }),
    db.invoice.count({ where }),
    db.invoice.aggregate({ where: { AND: [where, { status: { not: "CANCELLED" } }] }, _sum: { total: true } }),
    db.invoice.aggregate({ where: openWhere, _sum: { total: true, amountPaid: true } }),
  ]);
  const outstandingSum = round2(toNum(open._sum.total ?? 0) - toNum(open._sum.amountPaid ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Generated from subscriptions — billed once per period."
        actions={
          <ActionButton
            action={generateDueAction}
            variant="default"
            confirm={{
              title: "Generate due invoices?",
              description: "Creates draft invoices for every active subscription whose billing date has arrived. Already billed periods are skipped.",
              confirmLabel: "Generate",
            }}
          >
            Generate due invoices
          </ActionButton>
        }
      />
      <Stagger className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Invoices" value={count.toLocaleString("en-IN")} />
        <StatCard label="Total billed" value={formatMoney(sums._sum.total ?? 0)} hint="Excludes cancelled" />
        <StatCard label="Outstanding" value={formatMoney(outstandingSum)} tone={outstandingSum > 0 ? "danger" : "default"} />
      </Stagger>
      <div>
        <Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search number or customer…" />
            <DateRange />
          </div>
          <FilterTabs param="status" options={TABS} />
        </Toolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowHref={(r) => `/invoices/${r.id}`}
          empty={<EmptyState title="No invoices" description="Nothing matches these filters." />}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={count} />
      </div>
    </div>
  );
}

import Link from "next/link";
import type { PaymentMethod, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney } from "@/lib/format";
import { dateFilter, str } from "@/lib/billing/filters";
import { METHOD_LABEL, PAYMENT_METHODS } from "@/lib/validators/billing";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatCard } from "@/components/shared/stat-card";
import { Stagger } from "@/components/motion";
import { DateRange } from "@/components/billing/date-range";

export const metadata = { title: "Payments" };

const TABS = [{ value: "", label: "All" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))];

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
  { key: "date", header: "Date", cell: (r) => formatDate(r.paymentDate) },
  {
    key: "invoice",
    header: "Invoice",
    cell: (r) => (
      <Link href={`/invoices/${r.invoice.id}`} className="font-medium hover:underline">
        {r.invoice.number}
      </Link>
    ),
  },
  { key: "customer", header: "Customer", cell: (r) => r.invoice.customer.name },
  { key: "method", header: "Method", cell: (r) => METHOD_LABEL[r.method] },
  { key: "ref", header: "Reference", cell: (r) => r.reference ?? "—", className: "text-muted-foreground" },
  { key: "note", header: "Note", cell: (r) => r.note ?? "—", className: "max-w-56 truncate text-muted-foreground" },
  { key: "amount", header: "Amount", align: "right", cell: (r) => formatMoney(r.amount) },
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

  const [rows, count, sum] = await Promise.all([
    db.payment.findMany({ where, select: rowSelect, orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }], skip, take }),
    db.payment.count({ where }),
    db.payment.aggregate({ where, _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Every payment recorded against an invoice. Register new payments from the invoice." />
      <Stagger className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Payments" value={count.toLocaleString("en-IN")} />
        <StatCard label="Total received" value={formatMoney(sum._sum.amount ?? 0)} />
      </Stagger>
      <div>
        <Toolbar>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="Search invoice, customer, reference…" />
            <DateRange />
          </div>
          <FilterTabs param="method" options={TABS} />
        </Toolbar>
        <DataTable
          columns={columns}
          rows={rows}
          empty={<EmptyState title="No payments" description="Nothing matches these filters." />}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={count} />
      </div>
    </div>
  );
}

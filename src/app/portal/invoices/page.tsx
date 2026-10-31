import { db } from "@/lib/db";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney } from "@/lib/format";
import { displayStatus, outstanding } from "@/lib/invoice-status";
import { portalCustomer } from "@/lib/insights/portal";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "My invoices" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { customerId } = await portalCustomer();
  const { page, skip, take } = pageParams(await searchParams);
  const where = { customerId, status: { in: ["CONFIRMED", "PAID"] as ("CONFIRMED" | "PAID")[] } };
  const [rows, total] = await Promise.all([
    db.invoice.findMany({ where, orderBy: { invoiceDate: "desc" }, skip, take }),
    db.invoice.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="My invoices" />
      <DataTable
        rows={rows}
        rowHref={(r) => `/portal/invoices/${r.id}`}
        columns={[
          { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
          { key: "s", header: "Status", cell: (r) => <StatusBadge status={displayStatus(r)} /> },
          { key: "d", header: "Date", cell: (r) => formatDate(r.invoiceDate) },
          { key: "due", header: "Due", cell: (r) => formatDate(r.dueDate) },
          { key: "t", header: "Total", align: "right", cell: (r) => formatMoney(r.total) },
          { key: "o", header: "Amount due", align: "right", cell: (r) => formatMoney(outstanding(r)) },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

import { db } from "@/lib/db";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate } from "@/lib/format";
import { portalCustomer } from "@/lib/insights/portal";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "My subscriptions" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { customerId } = await portalCustomer();
  const { page, skip, take } = pageParams(await searchParams);
  const where = { customerId };
  const [rows, total] = await Promise.all([
    db.subscription.findMany({ where, include: { plan: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
    db.subscription.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="My subscriptions" />
      <DataTable
        rows={rows}
        rowHref={(r) => `/portal/subscriptions/${r.id}`}
        columns={[
          { key: "n", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
          { key: "p", header: "Plan", cell: (r) => r.plan.name },
          { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          { key: "x", header: "Next invoice", cell: (r) => formatDate(r.nextInvoiceDate) },
          { key: "e", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

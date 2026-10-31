import { Plus, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MetricStrip } from "@/components/shared/metric-strip";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";
import { TaxSheet } from "@/components/catalog/tax-sheet";
import { TaxRowActions } from "@/components/catalog/tax-actions";

export const metadata = { title: "Taxes" };

type Row = { id: string; name: string; rate: number; isActive: boolean; products: number };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const admin = user.role === "ADMIN";
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where = sp.q ? { name: { contains: sp.q, mode: "insensitive" as const } } : {};
  const [taxes, total, activeCount] = await Promise.all([
    db.tax.findMany({ where, skip, take, orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
    db.tax.count({ where }),
    db.tax.count({ where: { ...where, isActive: true } }),
  ]);
  const rows: Row[] = taxes.map((t) => ({
    id: t.id,
    name: t.name,
    rate: toNum(t.rate),
    isActive: t.isActive,
    products: t._count.products,
  }));

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "rate", header: "Rate", align: "right", cell: (r) => `${r.rate}%` },
    { key: "products", header: "Products", align: "right", cell: (r) => r.products },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];
  if (admin)
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <TaxSheet tax={r}>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </TaxSheet>
          <TaxRowActions id={r.id} isActive={r.isActive} />
        </div>
      ),
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        icon={Receipt}
        title="Taxes"
        description="Tax rates that can be attached to products."
        actions={
          admin && (
            <TaxSheet>
              <Button>
                <Plus className="size-4" />
                New tax
              </Button>
            </TaxSheet>
          )
        }
      />
      <MetricStrip items={[{ label: "Tax rates", value: total }, { label: "Active", value: activeCount }]} />
      <Toolbar>
        <SearchInput placeholder="Search taxes…" />
      </Toolbar>
      <Stagger>
        <DataTable columns={columns} rows={rows} />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}

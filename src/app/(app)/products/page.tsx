import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatMoney, humanize, toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";

export const metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  variants: number;
  taxes: string;
  isActive: boolean;
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.ProductWhereInput = {};
  if (sp.q) where.name = { contains: sp.q, mode: "insensitive" };
  if (sp.type === "SERVICE" || sp.type === "GOODS") where.type = sp.type;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: { taxes: { include: { tax: true } }, _count: { select: { variants: true } } },
    }),
    db.product.count({ where }),
  ]);
  const rows: Row[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    salesPrice: toNum(p.salesPrice),
    costPrice: toNum(p.costPrice),
    variants: p._count.variants,
    taxes: p.taxes.map((t) => t.tax.name).join(", ") || "—",
    isActive: p.isActive,
  }));

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", cell: (r) => humanize(r.type) },
    { key: "sales", header: "Sales price", align: "right", cell: (r) => formatMoney(r.salesPrice) },
    { key: "cost", header: "Cost price", align: "right", cell: (r) => formatMoney(r.costPrice) },
    { key: "variants", header: "Variants", align: "right", cell: (r) => r.variants },
    { key: "taxes", header: "Taxes", cell: (r) => <span className="text-muted-foreground">{r.taxes}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Things you sell, with optional variants and taxes."
        actions={
          user.role === "ADMIN" && (
            <Button asChild>
              <Link href="/products/new">
                <Plus className="size-4" />
                New product
              </Link>
            </Button>
          )
        }
      />
      <Toolbar>
        <SearchInput placeholder="Search products…" />
        <FilterTabs
          param="type"
          options={[
            { value: "", label: "All" },
            { value: "SERVICE", label: "Services" },
            { value: "GOODS", label: "Goods" },
          ]}
        />
      </Toolbar>
      <Stagger>
        <DataTable columns={columns} rows={rows} rowHref={(r) => `/products/${r.id}`} />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

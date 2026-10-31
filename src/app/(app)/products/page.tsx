import Link from "next/link";
import { Box, Package, Plus, Wrench } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatMoney, humanize, toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MetricStrip } from "@/components/shared/metric-strip";
import { DataTable, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";
import { Chip } from "@/components/catalog/plan-card";

export const metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  variants: { label: string; extra: number }[];
  taxes: string[];
  isActive: boolean;
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.ProductWhereInput = {};
  if (sp.q) where.name = { contains: sp.q, mode: "insensitive" };
  if (sp.type === "SERVICE" || sp.type === "GOODS") where.type = sp.type;

  const [products, total, activeCount, variantCount] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: { taxes: { include: { tax: true } }, variants: { orderBy: { createdAt: "asc" } } },
    }),
    db.product.count({ where }),
    db.product.count({ where: { ...where, isActive: true } }),
    db.productVariant.count({ where: { product: where } }),
  ]);
  const rows: Row[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    salesPrice: toNum(p.salesPrice),
    costPrice: toNum(p.costPrice),
    variants: p.variants.map((x) => ({ label: `${x.attribute}: ${x.value}`, extra: toNum(x.extraPrice) })),
    taxes: p.taxes.map((t) => `${t.tax.name}`),
    isActive: p.isActive,
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Product",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-ember-soft text-ember">
            {r.type === "GOODS" ? <Box className="size-4" /> : <Wrench className="size-4" />}
          </span>
          <div className="leading-tight">
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">{humanize(r.type)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price · Cost",
      align: "right",
      cell: (r) => {
        const margin = r.salesPrice > 0 ? Math.round(((r.salesPrice - r.costPrice) / r.salesPrice) * 100) : 0;
        return (
          <div className="leading-tight">
            <p className="font-mono-num font-medium">{formatMoney(r.salesPrice)}</p>
            <p className="font-mono-num text-xs text-muted-foreground">
              cost {formatMoney(r.costPrice)} · {margin}% margin
            </p>
          </div>
        );
      },
    },
    {
      key: "variants",
      header: "Variants",
      cell: (r) =>
        r.variants.length ? (
          <div className="flex max-w-72 flex-wrap gap-1">
            {r.variants.slice(0, 3).map((v) => (
              <Chip key={v.label}>
                {v.label}
                {v.extra > 0 && ` +${formatMoney(v.extra)}`}
              </Chip>
            ))}
            {r.variants.length > 3 && <Chip>+{r.variants.length - 3}</Chip>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "taxes",
      header: "Taxes",
      cell: (r) =>
        r.taxes.length ? (
          <div className="flex gap-1">
            {r.taxes.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        icon={Package}
        title="Products"
        description={`${total} products`}
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
      <MetricStrip items={[{ label: "Products", value: total }, { label: "Active", value: activeCount }, { label: "Variants", value: variantCount }]} />
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
    </div>
  );
}

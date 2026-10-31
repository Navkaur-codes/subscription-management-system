import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";

export const metadata = { title: "Discounts" };

type Row = Prisma.DiscountGetPayload<object>;

function state(d: Row): { label: string; tone: "success" | "neutral" | "warning" } {
  if (!d.isActive) return { label: "Inactive", tone: "neutral" };
  if (d.endDate && d.endDate < new Date()) return { label: "Expired", tone: "neutral" };
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return { label: "Exhausted", tone: "warning" };
  return { label: "Active", tone: "success" };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.DiscountWhereInput = sp.q
    ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { code: { contains: sp.q, mode: "insensitive" } }] }
    : {};
  const [rows, total] = await Promise.all([
    db.discount.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    db.discount.count({ where }),
  ]);

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "code", header: "Code", cell: (r) => (r.code ? <span className="font-mono text-xs">{r.code}</span> : "—") },
    {
      key: "value",
      header: "Discount",
      align: "right",
      cell: (r) => (r.type === "PERCENT" ? `${toNum(r.value)}%` : formatMoney(toNum(r.value))),
    },
    { key: "scope", header: "Scope", cell: (r) => (r.scope === "PRODUCT" ? "Products" : "Subscription") },
    {
      key: "validity",
      header: "Validity",
      cell: (r) => (r.startDate || r.endDate ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}` : "Always"),
    },
    { key: "usage", header: "Used", align: "right", cell: (r) => `${r.usedCount} / ${r.usageLimit ?? "∞"}` },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const s = state(r);
        return <StatusBadge status={s.label.toUpperCase()} label={s.label} tone={s.tone} />;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Discounts"
        description="Automatically applied to the next invoice when valid."
        actions={
          <Button asChild>
            <Link href="/discounts/new">
              <Plus className="size-4" />
              New discount
            </Link>
          </Button>
        }
      />
      <Toolbar>
        <SearchInput placeholder="Search name or code…" />
      </Toolbar>
      <Stagger>
        <DataTable columns={columns} rows={rows} rowHref={(r) => `/discounts/${r.id}`} />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

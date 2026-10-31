import Link from "next/link";
import { Percent, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MetricStrip } from "@/components/shared/metric-strip";
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

function ruleText(d: Row) {
  const off = d.type === "PERCENT" ? `${toNum(d.value)}% off` : `${formatMoney(toNum(d.value))} off`;
  const target = d.scope === "PRODUCT" ? "selected products" : "subscriptions";
  const conds = [
    d.minQuantity > 0 && `${d.minQuantity}+ units`,
    toNum(d.minPurchase) > 0 && `${formatMoney(toNum(d.minPurchase))}+ purchase`,
  ].filter(Boolean);
  return `${off} ${target}${conds.length ? ` with ${conds.join(" and ")}` : ""}`;
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.DiscountWhereInput = sp.q
    ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { code: { contains: sp.q, mode: "insensitive" } }] }
    : {};
  const [rows, total, activeCount, redeemed] = await Promise.all([
    db.discount.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    db.discount.count({ where }),
    db.discount.count({ where: { ...where, isActive: true } }),
    db.discount.aggregate({ where, _sum: { usedCount: true } }),
  ]);

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Discount",
      cell: (r) => (
        <div className="leading-tight">
          <p className="font-medium">{r.name}</p>
          {r.code && <p className="font-mono text-xs text-muted-foreground">{r.code}</p>}
        </div>
      ),
    },
    {
      key: "rule",
      header: "Rule",
      cell: (r) => <span className="block max-w-xs whitespace-normal text-sm">{ruleText(r)}</span>,
    },
    {
      key: "usage",
      header: "Usage",
      cell: (r) => {
        const pct = r.usageLimit ? Math.min(100, Math.round((r.usedCount / r.usageLimit) * 100)) : 0;
        return (
          <div className="w-36">
            <div className="num mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{r.usedCount} used</span>
              <span>{r.usageLimit ?? "unlimited"}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand-gradient" style={{ width: r.usageLimit ? `${pct}%` : "0%" }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "validity",
      header: "Validity",
      cell: (r) => (r.startDate || r.endDate ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}` : "No expiry"),
    },
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        icon={Percent}
        title="Discounts"
        description={`${total} discounts · applied automatically to the next valid invoice`}
        actions={
          <Button asChild>
            <Link href="/discounts/new">
              <Plus className="size-4" />
              New discount
            </Link>
          </Button>
        }
      />
      <MetricStrip items={[{ label: "Discounts", value: total }, { label: "Enabled", value: activeCount }, { label: "Times redeemed", value: redeemed._sum.usedCount ?? 0 }]} />
      <Toolbar>
        <SearchInput placeholder="Search name or code…" />
      </Toolbar>
      <Stagger>
        <DataTable columns={columns} rows={rows} rowHref={(r) => `/discounts/${r.id}`} />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}

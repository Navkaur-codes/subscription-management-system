import Link from "next/link";
import { Layers, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatMoney, humanize, toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MetricStrip } from "@/components/shared/metric-strip";
import {
  DataTable,
  EmptyState,
  type Column,
} from "@/components/shared/data-table";
import {
  Pagination,
  SearchInput,
  Toolbar,
} from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Magnetic, Stagger } from "@/components/motion";
import {
  Chip,
  PlanCard,
  availability,
  planChips,
  type PlanCardData,
} from "@/components/catalog/plan-card";
import { ViewToggle } from "@/components/catalog/view-toggle";

export const metadata = { title: "Plans" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const view = sp.view === "list" ? "list" : "grid";
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.PlanWhereInput = sp.q
    ? { name: { contains: sp.q, mode: "insensitive" } }
    : {};
  const [plans, total, activeCount, liveSubs] = await Promise.all([
    db.plan.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } },
      },
    }),
    db.plan.count({ where }),
    db.plan.count({ where: { ...where, isActive: true } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
  ]);
  const rows: PlanCardData[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    price: toNum(p.price),
    billingPeriod: p.billingPeriod,
    minQuantity: p.minQuantity,
    startDate: p.startDate,
    endDate: p.endDate,
    autoClose: p.autoClose,
    closable: p.closable,
    pausable: p.pausable,
    renewable: p.renewable,
    isActive: p.isActive,
    activeSubs: p._count.subscriptions,
  }));

  const columns: Column<PlanCardData>[] = [
    {
      key: "name",
      header: "Plan",
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (r) => formatMoney(r.price),
    },
    { key: "period", header: "Period", cell: (r) => humanize(r.billingPeriod) },
    {
      key: "qty",
      header: "Min qty",
      align: "right",
      cell: (r) => r.minQuantity,
    },
    {
      key: "window",
      header: "Available",
      cell: (r) => (
        <span className="text-muted-foreground">{availability(r)}</span>
      ),
    },
    {
      key: "flags",
      header: "Rules",
      cell: (r) => (
        <div className="flex max-w-56 flex-wrap gap-1">
          {planChips(r).map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
        </div>
      ),
    },
    {
      key: "subs",
      header: "Active subs",
      align: "right",
      cell: (r) => r.activeSubs,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        icon={Layers}
        title="Plans"
        description={`${total} plans · ${activeCount} active`}
        actions={
          user.role === "ADMIN" && (
            <Magnetic>
              <Button asChild>
                <Link href="/plans/new">
                  <Plus className="size-4" />
                  New plan
                </Link>
              </Button>
            </Magnetic>
          )
        }
      />
      <MetricStrip
        items={[
          { label: "Plans", value: total },
          { label: "Active plans", value: activeCount },
          {
            label: "Live subscriptions",
            value: liveSubs.toLocaleString("en-IN"),
          },
        ]}
      />
      <Toolbar>
        <SearchInput placeholder="Search plans…" />
        <ViewToggle current={view} />
      </Toolbar>
      <Stagger>
        {view === "list" ? (
          <DataTable
            columns={columns}
            rows={rows}
            rowHref={(r) => `/plans/${r.id}`}
          />
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              title="No plans found"
              description="Try a different search."
            />
          </div>
        ) : (
          <div className="card-surface overflow-hidden">
            <div className="-mr-px -mb-px grid sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          </div>
        )}
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}

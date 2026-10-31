import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney, humanize, toNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";

export const metadata = { title: "Plans" };

type Row = Prisma.PlanGetPayload<object>;

function flags(p: Row) {
  const f = [p.autoClose && "Auto close", p.closable && "Closable", p.pausable && "Pausable", p.renewable && "Renewable"].filter(Boolean);
  return f.length ? f.join(" · ") : "—";
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.PlanWhereInput = sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : {};
  const [rows, total] = await Promise.all([
    db.plan.findMany({ where, skip, take, orderBy: { name: "asc" } }),
    db.plan.count({ where }),
  ]);

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "price", header: "Price", align: "right", cell: (r) => formatMoney(toNum(r.price)) },
    { key: "period", header: "Period", cell: (r) => humanize(r.billingPeriod) },
    { key: "qty", header: "Min qty", align: "right", cell: (r) => r.minQuantity },
    {
      key: "window",
      header: "Available",
      cell: (r) => (r.startDate || r.endDate ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}` : "Always"),
    },
    { key: "flags", header: "Rules", cell: (r) => <span className="text-xs text-muted-foreground">{flags(r)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <>
      <PageHeader
        title="Plans"
        description="Recurring billing plans subscriptions are created from."
        actions={
          user.role === "ADMIN" && (
            <Button asChild>
              <Link href="/plans/new">
                <Plus className="size-4" />
                New plan
              </Link>
            </Button>
          )
        }
      />
      <Toolbar>
        <SearchInput placeholder="Search plans…" />
      </Toolbar>
      <Stagger>
        <DataTable columns={columns} rows={rows} rowHref={(r) => `/plans/${r.id}`} />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

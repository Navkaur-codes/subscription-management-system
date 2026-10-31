import { Plus, Users } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatMoney, toNum } from "@/lib/format";
import { customerStats } from "@/lib/insights/customers";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { Button } from "@/components/ui/button";
import { AvatarName } from "@/components/shared/avatar-name";
import { MetricStrip } from "@/components/shared/metric-strip";
import { Stagger } from "@/components/motion";

export const metadata = { title: "Customers" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const q = sp.q?.trim();
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const [rows, total, withActive, owed] = await Promise.all([
    db.customer.findMany({ where, orderBy: { name: "asc" }, skip, take }),
    db.customer.count({ where }),
    db.customer.count({ where: { subscriptions: { some: { status: "ACTIVE" } } } }),
    db.invoice.aggregate({ where: { status: "CONFIRMED" }, _sum: { total: true, amountPaid: true } }),
  ]);
  const { active, due } = await customerStats(rows.map((r) => r.id));

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        icon={Users}
        title="Customers"
        description="People and companies you bill."
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="size-4" /> New customer
            </Link>
          </Button>
        }
      />
      <MetricStrip
        items={[
          { label: "Customers", value: total.toLocaleString("en-IN"), hint: q ? "matching search" : "all time" },
          { label: "With active plan", value: withActive.toLocaleString("en-IN") },
          { label: "Total outstanding", value: formatMoney(Math.max(0, toNum(owed._sum.total) - toNum(owed._sum.amountPaid))) },
        ]}
      />
      <Toolbar>
        <SearchInput placeholder="Search name, email, company, city…" />
      </Toolbar>
      <Stagger>
        <DataTable
          rows={rows}
          rowHref={(r) => `/customers/${r.id}`}
          columns={[
            { key: "name", header: "Customer", cell: (r) => <AvatarName name={r.name} sub={r.email} /> },
            { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
            { key: "city", header: "City", cell: (r) => r.city ?? "—" },
            { key: "active", header: "Active subs", align: "right", cell: (r) => active.get(r.id) ?? 0 },
            { key: "due", header: "Outstanding", align: "right", cell: (r) => <span className="font-mono-num">{formatMoney(due.get(r.id) ?? 0)}</span> },
          ]}
        />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

import { Plus } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatMoney } from "@/lib/format";
import { customerStats } from "@/lib/insights/customers";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { Button } from "@/components/ui/button";
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
  const [rows, total] = await Promise.all([
    db.customer.findMany({ where, orderBy: { name: "asc" }, skip, take }),
    db.customer.count({ where }),
  ]);
  const { active, due } = await customerStats(rows.map((r) => r.id));

  return (
    <>
      <PageHeader
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
      <Toolbar>
        <SearchInput placeholder="Search name, email, company, city…" />
      </Toolbar>
      <Stagger>
        <DataTable
          rows={rows}
          rowHref={(r) => `/customers/${r.id}`}
          columns={[
            { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
            { key: "company", header: "Company", cell: (r) => r.company ?? "—" },
            { key: "email", header: "Email", cell: (r) => r.email },
            { key: "city", header: "City", cell: (r) => r.city ?? "—" },
            { key: "active", header: "Active subs", align: "right", cell: (r) => active.get(r.id) ?? 0 },
            { key: "due", header: "Outstanding", align: "right", cell: (r) => formatMoney(due.get(r.id) ?? 0) },
          ]}
        />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

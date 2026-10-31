import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { MetricStrip } from "@/components/shared/metric-strip";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { Stagger } from "@/components/motion";

export const metadata = { title: "Quotation templates" };

type Row = Prisma.QuotationTemplateGetPayload<{ include: { plan: true; _count: { select: { lines: true } } } }>;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const where: Prisma.QuotationTemplateWhereInput = sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : {};
  const [rows, total, lineCount] = await Promise.all([
    db.quotationTemplate.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: { plan: true, _count: { select: { lines: true } } },
    }),
    db.quotationTemplate.count({ where }),
    db.quotationTemplateLine.count({ where: { template: where } }),
  ]);

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "plan", header: "Plan", cell: (r) => r.plan.name },
    { key: "lines", header: "Lines", align: "right", cell: (r) => r._count.lines },
    { key: "validity", header: "Validity", align: "right", cell: (r) => `${r.validityDays} days` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        icon={FileText}
        title="Quotation templates"
        description="Reusable starting points for new subscriptions."
        actions={
          user.role === "ADMIN" && (
            <Button asChild>
              <Link href="/templates/new">
                <Plus className="size-4" />
                New template
              </Link>
            </Button>
          )
        }
      />
      <MetricStrip items={[{ label: "Templates", value: total }, { label: "Product lines", value: lineCount }]} />
      <Toolbar>
        <SearchInput placeholder="Search templates…" />
      </Toolbar>
      <Stagger>
        <DataTable columns={columns} rows={rows} rowHref={(r) => `/templates/${r.id}`} />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}

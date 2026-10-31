import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney } from "@/lib/format";
import { priceSubscription, toDiscountRule } from "@/lib/subscriptions/pricing";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { Stagger } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { PlanFilter } from "@/components/subscriptions/plan-filter";
import { closeExpiredAction } from "./actions";

export const metadata = { title: "Subscriptions" };

const STATUSES: SubscriptionStatus[] = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"];
const TABS = [{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))];

type Row = {
  id: string;
  number: string;
  customer: string;
  plan: string;
  status: SubscriptionStatus;
  startDate: Date;
  nextInvoiceDate: Date | null;
  expiryDate: Date | null;
  total: number;
};

const columns: Column<Row>[] = [
  { key: "number", header: "Number", cell: (r) => <span className="font-medium">{r.number}</span> },
  { key: "customer", header: "Customer", cell: (r) => r.customer },
  { key: "plan", header: "Plan", cell: (r) => r.plan },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "start", header: "Start", cell: (r) => formatDate(r.startDate) },
  { key: "next", header: "Next invoice", cell: (r) => formatDate(r.nextInvoiceDate) },
  { key: "expiry", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
  { key: "total", header: "Recurring", align: "right", cell: (r) => formatMoney(r.total) },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const status = STATUSES.includes(sp.status as SubscriptionStatus) ? (sp.status as SubscriptionStatus) : undefined;
  const q = sp.q?.trim();

  const where: Prisma.SubscriptionWhereInput = {
    ...(status && { status }),
    ...(sp.plan && { planId: sp.plan }),
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [subs, total, plans] = await Promise.all([
    db.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        status: true,
        startDate: true,
        nextInvoiceDate: true,
        expiryDate: true,
        customer: { select: { name: true } },
        plan: { select: { name: true } },
        discount: { include: { products: true } },
        lines: { select: { productId: true, quantity: true, unitPrice: true, taxRate: true } },
      },
    }),
    db.subscription.count({ where }),
    db.plan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const rows: Row[] = subs.map((s) => ({
    id: s.id,
    number: s.number,
    customer: s.customer.name,
    plan: s.plan.name,
    status: s.status,
    startDate: s.startDate,
    nextInvoiceDate: s.nextInvoiceDate,
    expiryDate: s.expiryDate,
    total: priceSubscription(s.lines, s.discount ? toDiscountRule(s.discount) : null).total,
  }));

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Quotations and recurring subscriptions across all customers."
        actions={
          <>
            <ActionButton
              action={closeExpiredAction}
              confirm={{
                title: "Close expired subscriptions?",
                description: "Active or paused subscriptions on auto-close plans whose expiry date has passed will be closed.",
                confirmLabel: "Close expired",
              }}
            >
              Close expired
            </ActionButton>
            <Button size="sm" asChild>
              <Link href="/subscriptions/new">
                <Plus className="size-4" /> New subscription
              </Link>
            </Button>
          </>
        }
      />
      <Toolbar>
        <FilterTabs param="status" options={TABS} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <PlanFilter plans={plans} />
          <SearchInput placeholder="Search number or customer…" />
        </div>
      </Toolbar>
      <Stagger>
        <DataTable
          columns={columns}
          rows={rows}
          rowHref={(r) => `/subscriptions/${r.id}`}
          empty={<EmptyState title="No subscriptions found" description="Try a different filter or create a new subscription." />}
        />
      </Stagger>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

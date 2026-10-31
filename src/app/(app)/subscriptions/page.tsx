import Link from "next/link";
import { Plus, Repeat } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, formatMoney } from "@/lib/format";
import { priceSubscription, toDiscountRule } from "@/lib/subscriptions/pricing";
import { listMetrics, listWhere } from "@/lib/subscriptions/list-metrics";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, EmptyState, type Column } from "@/components/shared/data-table";
import { FilterTabs, Pagination, SearchInput, Toolbar } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { AvatarName, MetricStrip } from "@/components/shared/display";
import { ActionButton } from "@/components/shared/action-button";
import { Stagger } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { PlanFilter } from "@/components/subscriptions/plan-filter";
import { closeExpiredAction } from "./actions";

export const metadata = { title: "Subscriptions" };

const STATUSES: SubscriptionStatus[] = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"];
const label = (s: string) => s[0] + s.slice(1).toLowerCase();
const n = (v: number) => v.toLocaleString("en-IN");

type Row = {
  id: string;
  number: string;
  customer: string;
  email: string;
  plan: string;
  status: SubscriptionStatus;
  nextInvoiceDate: Date | null;
  expiryDate: Date | null;
  total: number;
};

const columns: Column<Row>[] = [
  {
    key: "number",
    header: "Subscription",
    cell: (r) => (
      <div className="flex min-w-0 items-center gap-4">
        <span className="w-28 shrink-0 font-medium">{r.number}</span>
        <AvatarName name={r.customer} sub={r.email} size="sm" />
      </div>
    ),
  },
  {
    key: "plan",
    header: "Plan",
    cell: (r) => <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">{r.plan}</span>,
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "next", header: "Next invoice", cell: (r) => formatDate(r.nextInvoiceDate) },
  { key: "expiry", header: "Expiry", cell: (r) => formatDate(r.expiryDate) },
  { key: "total", header: "Recurring", align: "right", cell: (r) => <span className="font-medium">{formatMoney(r.total)}</span> },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("ADMIN", "STAFF");
  const sp = await searchParams;
  const { page, skip, take } = pageParams(sp);
  const status = STATUSES.includes(sp.status as SubscriptionStatus) ? (sp.status as SubscriptionStatus) : undefined;
  const filter = { planId: sp.plan, q: sp.q?.trim() };
  const where = { ...listWhere(filter), ...(status && { status }) };

  const [subs, metrics, plans] = await Promise.all([
    db.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        status: true,
        nextInvoiceDate: true,
        expiryDate: true,
        customer: { select: { name: true, email: true } },
        plan: { select: { name: true } },
        discount: { include: { products: true } },
        lines: { select: { productId: true, quantity: true, unitPrice: true, taxRate: true } },
      },
    }),
    listMetrics(filter),
    db.plan.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const total = status ? (metrics.counts[status] ?? 0) : metrics.all;
  const tabs = [
    { value: "", label: `All ${n(metrics.all)}` },
    ...STATUSES.map((s) => ({ value: s, label: `${label(s)} ${n(metrics.counts[s] ?? 0)}` })),
  ];

  const rows: Row[] = subs.map((s) => ({
    id: s.id,
    number: s.number,
    customer: s.customer.name,
    email: s.customer.email,
    plan: s.plan.name,
    status: s.status,
    nextInvoiceDate: s.nextInvoiceDate,
    expiryDate: s.expiryDate,
    total: priceSubscription(s.lines, s.discount ? toDiscountRule(s.discount) : null).total,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        icon={Repeat}
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
      <div>
        <MetricStrip
          items={[
            { label: "Active", value: n(metrics.counts.ACTIVE ?? 0), hint: "Billing now" },
            { label: "MRR", value: formatMoney(metrics.mrr), hint: "Monthly, pre-tax" },
            { label: "Paused", value: n(metrics.counts.PAUSED ?? 0), hint: "Not billing" },
            { label: "Closing soon", value: n(metrics.closingSoon), hint: "Expiring in 30 days" },
          ]}
        />
        <Toolbar>
          <div className="-mx-1 min-w-0 overflow-x-auto px-1 pb-1 xl:pb-0">
            <FilterTabs param="status" options={tabs} />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <PlanFilter plans={plans} />
            <SearchInput placeholder="Search number or customer…" />
          </div>
        </Toolbar>
        <Stagger>
          <DataTable
            columns={columns}
            rows={rows}
            rowHref={(r) => `/subscriptions/${r.id}`}
            empty={<EmptyState icon={Repeat} title="No subscriptions found" description="Try a different filter or create a new subscription." />}
          />
        </Stagger>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  );
}

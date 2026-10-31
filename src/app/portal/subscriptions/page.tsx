import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { db } from "@/lib/db";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate, humanize } from "@/lib/format";
import { portalCustomer } from "@/lib/insights/portal";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Stagger } from "@/components/motion";

export const metadata = { title: "My subscriptions" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { customerId } = await portalCustomer();
  const { page, skip, take } = pageParams(await searchParams);
  const where = { customerId };
  const [rows, total] = await Promise.all([
    db.subscription.findMany({ where, include: { plan: { select: { name: true, billingPeriod: true } } }, orderBy: { createdAt: "desc" }, skip, take }),
    db.subscription.count({ where }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Plans" title="My subscriptions" description="Pause, resume or cancel from a subscription's page." />
      {rows.length === 0 ? (
        <div className="card-surface">
          <EmptyState title="No subscriptions yet" description="Your subscriptions will appear here." />
        </div>
      ) : (
        <Stagger className="grid gap-6 sm:grid-cols-2">
          {rows.map((r) => (
            <Link key={r.id} href={`/portal/subscriptions/${r.id}`} data-stagger className="card-surface card-hover group block p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow">{r.number}</p>
                  <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">{r.plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{humanize(r.plan.billingPeriod)} billing</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarClock className="size-4" /> Next invoice {formatDate(r.nextInvoiceDate)}
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </Stagger>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

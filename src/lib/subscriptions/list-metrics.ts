import { addDays } from "date-fns";
import { Prisma, type SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type ListFilter = { planId?: string; q?: string };

/** Prisma where for plan + search (status is applied separately so tabs can show counts). */
export function listWhere({ planId, q }: ListFilter): Prisma.SubscriptionWhereInput {
  return {
    ...(planId && { planId }),
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
}

/** Same MRR definition as the dashboard: pre-tax line amounts × monthly factor, ACTIVE only. */
async function mrr({ planId, q }: ListFilter): Promise<number> {
  const like = q ? `%${q}%` : null;
  const rows = await db.$queryRaw<{ mrr: number }[]>`
    SELECT COALESCE(SUM(sl.amount * CASE p."billingPeriod"::text
      WHEN 'DAILY' THEN 30 WHEN 'WEEKLY' THEN 52.0/12 WHEN 'YEARLY' THEN 1.0/12 ELSE 1 END), 0)::float8 AS mrr
    FROM "Subscription" s
    JOIN "Plan" p ON p.id = s."planId"
    JOIN "SubscriptionLine" sl ON sl."subscriptionId" = s.id
    ${like ? Prisma.sql`JOIN "Customer" c ON c.id = s."customerId"` : Prisma.empty}
    WHERE s.status = 'ACTIVE'
    ${planId ? Prisma.sql`AND s."planId" = ${planId}` : Prisma.empty}
    ${like ? Prisma.sql`AND (s.number ILIKE ${like} OR c.name ILIKE ${like})` : Prisma.empty}`;
  return rows[0]?.mrr ?? 0;
}

/** Status counts, MRR and "closing soon" for the list header. */
export async function listMetrics(filter: ListFilter) {
  const where = listWhere(filter);
  const [groups, closingSoon, mrrValue] = await Promise.all([
    db.subscription.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.subscription.count({
      where: {
        ...where,
        status: { in: ["ACTIVE", "PAUSED"] },
        expiryDate: { gte: new Date(), lte: addDays(new Date(), 30) },
      },
    }),
    mrr(filter),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all])) as Partial<
    Record<SubscriptionStatus, number>
  >;
  const all = groups.reduce((s, g) => s + g._count._all, 0);
  return { counts, all, closingSoon, mrr: mrrValue };
}

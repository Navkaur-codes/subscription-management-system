import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import type { BillingPeriod } from "@prisma/client";
import { db } from "@/lib/db";
import { monthlyFactor } from "@/lib/dates";
import { round2, toNum } from "@/lib/format";
import { overdueWhere } from "@/lib/invoice-status";

type PeriodRow = { period: BillingPeriod; total: number };
type MonthRow = { month: Date; total: number };

export async function dashboardMetrics() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const sixAgo = startOfMonth(subMonths(now, 5));

  const [active, byPeriod, collected, outstandingAgg, overdueAgg, overdueList, recentPayments, statusGroups, monthly] =
    await Promise.all([
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.$queryRaw<PeriodRow[]>`
        SELECT p."billingPeriod"::text AS period, COALESCE(SUM(sl.amount), 0)::float8 AS total
        FROM "SubscriptionLine" sl
        JOIN "Subscription" s ON s.id = sl."subscriptionId"
        JOIN "Plan" p ON p.id = s."planId"
        WHERE s.status = 'ACTIVE'
        GROUP BY p."billingPeriod"`,
      db.payment.aggregate({
        where: { paymentDate: { gte: monthStart, lte: endOfMonth(now) } },
        _sum: { amount: true },
      }),
      db.invoice.aggregate({ where: { status: "CONFIRMED" }, _sum: { total: true, amountPaid: true } }),
      db.invoice.aggregate({
        where: overdueWhere(now),
        _count: { _all: true },
        _sum: { total: true, amountPaid: true },
      }),
      db.invoice.findMany({
        where: overdueWhere(now),
        orderBy: { dueDate: "asc" },
        take: 8,
        include: { customer: { select: { name: true } } },
      }),
      db.payment.findMany({
        orderBy: { paymentDate: "desc" },
        take: 8,
        include: { invoice: { select: { id: true, number: true, customer: { select: { name: true } } } } },
      }),
      db.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
      db.$queryRaw<MonthRow[]>`
        SELECT date_trunc('month', "paymentDate") AS month, COALESCE(SUM(amount), 0)::float8 AS total
        FROM "Payment"
        WHERE "paymentDate" >= ${sixAgo}
        GROUP BY 1`,
    ]);

  const mrr = round2(byPeriod.reduce((sum, r) => sum + r.total * monthlyFactor(r.period), 0));
  const byMonth = new Map(monthly.map((m) => [format(new Date(m.month), "yyyy-MM"), m.total]));
  const revenue = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { label: format(d, "MMM"), value: byMonth.get(format(d, "yyyy-MM")) ?? 0, current: i === 5 };
  });

  return {
    active,
    mrr,
    collected: toNum(collected._sum.amount),
    outstanding: Math.max(0, toNum(outstandingAgg._sum.total) - toNum(outstandingAgg._sum.amountPaid)),
    overdueCount: overdueAgg._count._all,
    overdueAmount: Math.max(0, toNum(overdueAgg._sum.total) - toNum(overdueAgg._sum.amountPaid)),
    overdueList,
    recentPayments,
    statuses: statusGroups.map((s) => ({ status: s.status, count: s._count._all })),
    revenue,
  };
}

import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import type { BillingPeriod } from "@prisma/client";
import { db } from "@/lib/db";
import { monthlyFactor } from "@/lib/dates";
import { round2, toNum } from "@/lib/format";
import { overdueWhere } from "@/lib/invoice-status";

type PeriodRow = { period: BillingPeriod; total: number };
type MonthRow = { month: Date; total: number };
type PlanRow = { name: string; period: BillingPeriod; total: number; subs: number };
type SeriesRow = { month: Date; subs: number; mrr: number };

const key = (d: Date) => format(new Date(d), "yyyy-MM");

/** Percent change; null when there is no baseline. */
function delta(now: number, before: number): number | undefined {
  if (!before) return undefined;
  return Math.round(((now - before) / before) * 1000) / 10;
}

/** Live-subscription count and MRR at the end of each of the last 12 months. */
async function mrrSeries() {
  return db.$queryRaw<SeriesRow[]>`
    SELECT m.month AS month,
           COUNT(DISTINCT s.id)::int AS subs,
           COALESCE(SUM(sl.amount * CASE p."billingPeriod"::text
             WHEN 'DAILY' THEN 30 WHEN 'WEEKLY' THEN 52.0/12 WHEN 'YEARLY' THEN 1.0/12 ELSE 1 END), 0)::float8 AS mrr
    FROM (SELECT date_trunc('month', now()) - (n || ' months')::interval AS month FROM generate_series(0, 11) AS n) AS m
    LEFT JOIN "Subscription" s
      ON s.status IN ('ACTIVE','CLOSED')
     AND s."startDate" <= (m.month + interval '1 month - 1 second')
     AND (s.status <> 'CLOSED' OR COALESCE(s."closedAt", s."expiryDate", s."updatedAt") > (m.month + interval '1 month - 1 second'))
    LEFT JOIN "Plan" p ON p.id = s."planId"
    LEFT JOIN "SubscriptionLine" sl ON sl."subscriptionId" = s.id
    GROUP BY m.month ORDER BY m.month`;
}

export async function dashboardMetrics() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const sixAgo = startOfMonth(subMonths(now, 5));
  const twelveAgo = startOfMonth(subMonths(now, 11));

  const [
    active,
    byPeriod,
    collected,
    outstandingAgg,
    overdueAgg,
    overdueList,
    recentPayments,
    statusGroups,
    paymentsByMonth,
    invoicedByMonth,
    overdueByMonth,
    series,
    topPlans,
  ] = await Promise.all([
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
      include: { customer: { select: { name: true, email: true } } },
    }),
    db.payment.findMany({
      orderBy: { paymentDate: "desc" },
      take: 8,
      include: { invoice: { select: { id: true, number: true, customer: { select: { name: true, email: true } } } } },
    }),
    db.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    db.$queryRaw<MonthRow[]>`
      SELECT date_trunc('month', "paymentDate") AS month, COALESCE(SUM(amount), 0)::float8 AS total
      FROM "Payment" WHERE "paymentDate" >= ${twelveAgo} GROUP BY 1`,
    db.$queryRaw<MonthRow[]>`
      SELECT date_trunc('month', "invoiceDate") AS month, COALESCE(SUM(total), 0)::float8 AS total
      FROM "Invoice" WHERE status IN ('CONFIRMED','PAID') AND "invoiceDate" >= ${twelveAgo} GROUP BY 1`,
    db.$queryRaw<MonthRow[]>`
      SELECT date_trunc('month', "dueDate") AS month, COUNT(*)::float8 AS total
      FROM "Invoice" WHERE status = 'CONFIRMED' AND "dueDate" < ${now} AND "dueDate" >= ${twelveAgo} GROUP BY 1`,
    mrrSeries(),
    db.$queryRaw<PlanRow[]>`
      SELECT p.name AS name, p."billingPeriod"::text AS period,
             COALESCE(SUM(sl.amount), 0)::float8 AS total, COUNT(DISTINCT s.id)::int AS subs
      FROM "SubscriptionLine" sl
      JOIN "Subscription" s ON s.id = sl."subscriptionId"
      JOIN "Plan" p ON p.id = s."planId"
      WHERE s.status = 'ACTIVE'
      GROUP BY p.id, p.name, p."billingPeriod"`,
  ]);

  const mrr = round2(byPeriod.reduce((sum, r) => sum + r.total * monthlyFactor(r.period), 0));
  const months = Array.from({ length: 12 }, (_, i) => subMonths(now, 11 - i));
  const pay = new Map(paymentsByMonth.map((m) => [key(m.month), m.total]));
  const inv = new Map(invoicedByMonth.map((m) => [key(m.month), m.total]));
  const od = new Map(overdueByMonth.map((m) => [key(m.month), m.total]));
  const ser = new Map(series.map((m) => [key(m.month), m]));

  const mrrTrend = months.map((d) => ({ label: format(d, "MMM"), value: round2(ser.get(key(d))?.mrr ?? 0) }));
  mrrTrend[11] = { ...mrrTrend[11], value: mrr };
  const subsTrend = months.map((d) => ser.get(key(d))?.subs ?? 0);
  subsTrend[11] = active;
  const collectedTrend = months.map((d) => pay.get(key(d)) ?? 0);
  const invoicedVsCollected = months.slice(6).map((d) => ({
    label: format(d, "MMM"),
    invoiced: inv.get(key(d)) ?? 0,
    collected: pay.get(key(d)) ?? 0,
  }));
  const outstandingTrend = months.map((d) => Math.max(0, (inv.get(key(d)) ?? 0) - (pay.get(key(d)) ?? 0)));
  const overdueTrend = months.map((d) => od.get(key(d)) ?? 0);

  const collectedNow = toNum(collected._sum.amount);
  const collectedBefore = pay.get(key(lastMonthStart)) ?? 0;
  const outstandingNow = Math.max(0, toNum(outstandingAgg._sum.total) - toNum(outstandingAgg._sum.amountPaid));

  const planMrr = topPlans
    .map((p) => ({ name: p.name, subs: p.subs, value: round2(p.total * monthlyFactor(p.period)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    active,
    mrr,
    collected: collectedNow,
    outstanding: outstandingNow,
    overdueCount: overdueAgg._count._all,
    overdueAmount: Math.max(0, toNum(overdueAgg._sum.total) - toNum(overdueAgg._sum.amountPaid)),
    overdueList,
    recentPayments,
    statuses: statusGroups.map((s) => ({ status: s.status, count: s._count._all })),
    deltas: {
      active: delta(active, subsTrend[10]),
      mrr: delta(mrr, mrrTrend[10].value),
      collected: delta(collectedNow, collectedBefore),
    },
    trends: {
      active: subsTrend.slice(6),
      mrr: mrrTrend.slice(6).map((m) => m.value),
      collected: collectedTrend.slice(6),
      outstanding: outstandingTrend.slice(6),
      overdue: overdueTrend.slice(6),
    },
    mrrTrend,
    invoicedVsCollected,
    planMrr,
  };
}

import { format, formatDistanceToNowStrict, startOfMonth, subMonths } from "date-fns";
import type { BillingPeriod } from "@prisma/client";
import { db } from "@/lib/db";
import { monthlyFactor } from "@/lib/dates";
import { shortMoney } from "./money";
import { humanize, round2 } from "@/lib/format";

type MonthRow = { month: Date; total: number };
type PlanRow = { name: string; period: BillingPeriod; total: number; subs: number };
type SeriesRow = { month: Date; subs: number; mrr: number };
type InvoiceRow = { k: string; month: Date; a: number; b: number; c: number };
type OverdueRow = { id: string; number: string; dueDate: Date; total: number; amountPaid: number; name: string };
type PaymentRow = { id: string; amount: number; method: string; paymentDate: Date; invoiceId: string; number: string; name: string };

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
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const twelveAgo = startOfMonth(subMonths(now, 11));

  const [invoiceRows, overdueRaw, paymentRaw, statusGroups, paymentsByMonth, series, topPlans] = await Promise.all([
    db.$queryRaw<InvoiceRow[]>`
      SELECT 'inv' AS k, date_trunc('month', "invoiceDate") AS month, SUM(total)::float8 AS a, 0::float8 AS b, 0::float8 AS c
      FROM "Invoice" WHERE status IN ('CONFIRMED','PAID') AND "invoiceDate" >= ${twelveAgo} GROUP BY 2
      UNION ALL
      SELECT 'od', date_trunc('month', "dueDate"), COUNT(*)::float8, 0, 0
      FROM "Invoice" WHERE status = 'CONFIRMED' AND "dueDate" < ${now} AND "dueDate" >= ${twelveAgo} GROUP BY 2
      UNION ALL
      SELECT 'open', ${now}::timestamp, COALESCE(SUM(total), 0)::float8, COALESCE(SUM("amountPaid"), 0)::float8, 0
      FROM "Invoice" WHERE status = 'CONFIRMED'
      UNION ALL
      SELECT 'overdue', ${now}::timestamp, COALESCE(SUM(total), 0)::float8, COALESCE(SUM("amountPaid"), 0)::float8, COUNT(*)::float8
      FROM "Invoice" WHERE status = 'CONFIRMED' AND "dueDate" < ${now}`,
    db.$queryRaw<OverdueRow[]>`
      SELECT i.id, i.number, i."dueDate", i.total::float8 AS total, i."amountPaid"::float8 AS "amountPaid", c.name
      FROM "Invoice" i JOIN "Customer" c ON c.id = i."customerId"
      WHERE i.status = 'CONFIRMED' AND i."dueDate" < ${now}
      ORDER BY i."dueDate" ASC LIMIT 8`,
    db.$queryRaw<PaymentRow[]>`
      SELECT p.id, p.amount::float8 AS amount, p.method::text AS method, p."paymentDate", i.id AS "invoiceId", i.number, c.name
      FROM "Payment" p JOIN "Invoice" i ON i.id = p."invoiceId" JOIN "Customer" c ON c.id = i."customerId"
      ORDER BY p."paymentDate" DESC LIMIT 12`,
    db.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    db.$queryRaw<MonthRow[]>`
      SELECT date_trunc('month', "paymentDate") AS month, COALESCE(SUM(amount), 0)::float8 AS total
      FROM "Payment" WHERE "paymentDate" >= ${twelveAgo} GROUP BY 1`,
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

  const active = statusGroups.find((g) => g.status === "ACTIVE")?._count._all ?? 0;
  const mrr = round2(topPlans.reduce((sum, r) => sum + r.total * monthlyFactor(r.period), 0));
  const open = invoiceRows.find((r) => r.k === "open");
  const overdue = invoiceRows.find((r) => r.k === "overdue");
  const overdueList = overdueRaw.map((r) => ({
    id: r.id,
    number: r.number,
    status: "CONFIRMED" as const,
    dueDate: new Date(r.dueDate),
    total: r.total,
    amountPaid: r.amountPaid,
    customer: { name: r.name },
  }));
  const recentPayments = paymentRaw.map((r) => ({
    id: r.id,
    amount: r.amount,
    method: r.method,
    paymentDate: new Date(r.paymentDate),
    invoice: { id: r.invoiceId, number: r.number, customer: { name: r.name } },
  }));
  const months = Array.from({ length: 12 }, (_, i) => subMonths(now, 11 - i));
  const pay = new Map(paymentsByMonth.map((m) => [key(m.month), m.total]));
  const inv = new Map(invoiceRows.filter((r) => r.k === "inv").map((m) => [key(m.month), m.a]));
  const od = new Map(invoiceRows.filter((r) => r.k === "od").map((m) => [key(m.month), m.a]));
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

  const collectedNow = pay.get(key(now)) ?? 0;
  const collectedBefore = pay.get(key(lastMonthStart)) ?? 0;
  const outstandingNow = Math.max(0, (open?.a ?? 0) - (open?.b ?? 0));

  const planMrr = topPlans
    .map((p) => ({ name: p.name, subs: p.subs, value: round2(p.total * monthlyFactor(p.period)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const ticker = recentPayments.map(
    (p) => `${p.invoice.number} · paid · ${shortMoney(p.amount)} · ${humanize(p.method)} · ${formatDistanceToNowStrict(p.paymentDate)} ago`
  );

  return {
    ticker,
    active,
    mrr,
    collected: collectedNow,
    outstanding: outstandingNow,
    overdueCount: overdue?.c ?? 0,
    overdueAmount: Math.max(0, (overdue?.a ?? 0) - (overdue?.b ?? 0)),
    overdueList,
    recentPayments: recentPayments.slice(0, 8),
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

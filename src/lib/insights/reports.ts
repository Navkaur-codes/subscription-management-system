import type { Prisma } from "@prisma/client";
import { endOfDay } from "date-fns";
import { db } from "@/lib/db";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { displayStatus, outstanding } from "@/lib/invoice-status";

import { STATUS_OPTIONS, type ReportView } from "./report-options";

export type ReportFilters = { view: ReportView; from?: Date; to?: Date; status?: string; plan?: string; q?: string };

export const EXPORT_CAP = 10000;

type SP = Record<string, string | undefined>;


export function parseFilters(sp: SP): ReportFilters {
  const view: ReportView = sp.view === "invoices" || sp.view === "payments" ? sp.view : "subscriptions";
  const date = (v?: string) => {
    const d = v ? new Date(v) : undefined;
    return d && !Number.isNaN(d.getTime()) ? d : undefined;
  };
  const to = date(sp.to);
  const status = sp.status && STATUS_OPTIONS[view].includes(sp.status) ? sp.status : undefined;
  return {
    view,
    from: date(sp.from),
    to: to ? endOfDay(to) : undefined,
    status,
    plan: sp.plan || undefined,
    q: sp.q?.trim() || undefined,
  };
}

const range = (f: ReportFilters) => (f.from || f.to ? { gte: f.from, lte: f.to } : undefined);
const customerLike = (q?: string): Prisma.CustomerWhereInput | undefined =>
  q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : undefined;

export function subscriptionWhere(f: ReportFilters): Prisma.SubscriptionWhereInput {
  return {
    startDate: range(f),
    status: f.status ? (f.status as Prisma.SubscriptionWhereInput["status"]) : undefined,
    planId: f.plan,
    customer: customerLike(f.q),
  };
}

export function invoiceWhere(f: ReportFilters): Prisma.InvoiceWhereInput {
  const base: Prisma.InvoiceWhereInput = {
    invoiceDate: range(f),
    customer: customerLike(f.q),
    subscription: f.plan ? { planId: f.plan } : undefined,
  };
  if (f.status === "OVERDUE") return { ...base, status: "CONFIRMED", dueDate: { lt: new Date() } };
  return { ...base, status: f.status ? (f.status as Prisma.InvoiceWhereInput["status"]) : undefined };
}

export function paymentWhere(f: ReportFilters): Prisma.PaymentWhereInput {
  return {
    paymentDate: range(f),
    method: f.status ? (f.status as Prisma.PaymentWhereInput["method"]) : undefined,
    invoice: {
      customer: customerLike(f.q),
      subscription: f.plan ? { planId: f.plan } : undefined,
    },
  };
}

export const subscriptionInclude = {
  customer: { select: { name: true } },
  plan: { select: { name: true, billingPeriod: true } },
} satisfies Prisma.SubscriptionInclude;

export const invoiceInclude = { customer: { select: { name: true } } } satisfies Prisma.InvoiceInclude;

export const paymentInclude = {
  invoice: { select: { id: true, number: true, customer: { select: { name: true } } } },
} satisfies Prisma.PaymentInclude;

/** Summary tiles for the current view + filters. */
export async function reportSummary(f: ReportFilters): Promise<{ label: string; value: string }[]> {
  if (f.view === "subscriptions") {
    const where = subscriptionWhere(f);
    const [count, active] = await Promise.all([
      db.subscription.count({ where }),
      db.subscription.count({ where: { ...where, status: "ACTIVE" } }),
    ]);
    return [
      { label: "Subscriptions", value: count.toLocaleString("en-IN") },
      { label: "Active", value: active.toLocaleString("en-IN") },
    ];
  }
  if (f.view === "invoices") {
    const where = invoiceWhere(f);
    const [all, open] = await Promise.all([
      db.invoice.aggregate({ where, _count: { _all: true }, _sum: { total: true, amountPaid: true } }),
      db.invoice.aggregate({ where: { ...where, status: "CONFIRMED" }, _sum: { total: true, amountPaid: true } }),
    ]);
    return [
      { label: "Invoices", value: all._count._all.toLocaleString("en-IN") },
      { label: "Invoiced", value: formatMoney(all._sum.total) },
      { label: "Paid", value: formatMoney(all._sum.amountPaid) },
      { label: "Outstanding", value: formatMoney(Math.max(0, toNum(open._sum.total) - toNum(open._sum.amountPaid))) },
    ];
  }
  const agg = await db.payment.aggregate({ where: paymentWhere(f), _count: { _all: true }, _sum: { amount: true } });
  return [
    { label: "Payments", value: agg._count._all.toLocaleString("en-IN") },
    { label: "Collected", value: formatMoney(agg._sum.amount) },
  ];
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/** CSV text (header + rows) for the current view, capped at EXPORT_CAP rows. */
export async function reportCsv(f: ReportFilters): Promise<string> {
  const rows: (string | number)[][] = [];
  let header: string[];
  if (f.view === "subscriptions") {
    header = ["Number", "Customer", "Plan", "Status", "Start", "Expiry", "Next invoice"];
    const data = await db.subscription.findMany({
      where: subscriptionWhere(f),
      include: subscriptionInclude,
      orderBy: { createdAt: "desc" },
      take: EXPORT_CAP,
    });
    for (const s of data)
      rows.push([s.number, s.customer.name, s.plan.name, s.status, formatDate(s.startDate), formatDate(s.expiryDate), formatDate(s.nextInvoiceDate)]);
  } else if (f.view === "invoices") {
    header = ["Number", "Customer", "Status", "Invoice date", "Due date", "Total", "Paid", "Outstanding"];
    const data = await db.invoice.findMany({
      where: invoiceWhere(f),
      include: invoiceInclude,
      orderBy: { invoiceDate: "desc" },
      take: EXPORT_CAP,
    });
    for (const i of data)
      rows.push([i.number, i.customer.name, displayStatus(i), formatDate(i.invoiceDate), formatDate(i.dueDate), toNum(i.total), toNum(i.amountPaid), outstanding(i)]);
  } else {
    header = ["Date", "Invoice", "Customer", "Method", "Amount", "Reference"];
    const data = await db.payment.findMany({
      where: paymentWhere(f),
      include: paymentInclude,
      orderBy: { paymentDate: "desc" },
      take: EXPORT_CAP,
    });
    for (const p of data)
      rows.push([formatDate(p.paymentDate), p.invoice.number, p.invoice.customer.name, p.method, toNum(p.amount), p.reference ?? ""]);
  }
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

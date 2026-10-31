import type { InvoiceStatus, Prisma } from "@prisma/client";
import { round2, toNum } from "./format";

type InvLike = {
  status: InvoiceStatus;
  dueDate: Date;
  total: Prisma.Decimal | number;
  amountPaid: Prisma.Decimal | number;
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "CANCELLED"], // PAID is set automatically by payments
  PAID: [],
  CANCELLED: [],
};

export function outstanding(inv: InvLike): number {
  if (inv.status === "CANCELLED" || inv.status === "DRAFT") return 0;
  return Math.max(0, round2(toNum(inv.total) - toNum(inv.amountPaid)));
}

export function isOverdue(inv: InvLike, now = new Date()): boolean {
  return inv.status === "CONFIRMED" && inv.dueDate < now && outstanding(inv) > 0;
}

/** Status to show in the UI: OVERDUE / PARTIAL are derived, not stored. */
export function displayStatus(inv: InvLike, now = new Date()): string {
  if (isOverdue(inv, now)) return "OVERDUE";
  if (inv.status === "CONFIRMED" && toNum(inv.amountPaid) > 0) return "PARTIAL";
  return inv.status;
}

/** Prisma where-clause for overdue invoices (use in lists & dashboard). */
export function overdueWhere(now = new Date()): Prisma.InvoiceWhereInput {
  return { status: "CONFIRMED", dueDate: { lt: now } };
}

/** Prisma where-clause for unpaid (outstanding) invoices. */
export const outstandingWhere: Prisma.InvoiceWhereInput = { status: "CONFIRMED" };

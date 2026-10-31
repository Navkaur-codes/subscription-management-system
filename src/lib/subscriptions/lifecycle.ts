import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { today } from "@/lib/dates";
import { canRenew, transitionBlockReason } from "@/lib/subscription-status";
import { termEnd } from "./pricing";

/** Move a subscription to a new status, enforcing plan rules and applying side effects. */
export async function changeStatus(id: string, to: SubscriptionStatus) {
  const sub = await db.subscription.findUniqueOrThrow({
    where: { id },
    include: {
      plan: { select: { closable: true, pausable: true, renewable: true } },
      _count: { select: { invoices: true } },
    },
  });
  const block = transitionBlockReason(sub.status, to, sub.plan);
  if (block) throw new Error(block);

  const now = today();
  const data: Prisma.SubscriptionUpdateInput = { status: to };
  if (to === "ACTIVE" && sub.status !== "PAUSED" && !sub.nextInvoiceDate) {
    data.nextInvoiceDate = sub.startDate < now && sub._count.invoices === 0 ? now : sub.startDate;
  }
  if (to === "ACTIVE" && sub.status === "PAUSED" && sub.nextInvoiceDate && sub.nextInvoiceDate < now) {
    data.nextInvoiceDate = now;
  }
  if (to === "CLOSED") {
    data.closedAt = new Date();
    data.nextInvoiceDate = null;
  }
  return db.subscription.update({ where: { id }, data });
}

/** Extend expiry by one more term (renewable plans only). */
export async function renewSubscription(id: string) {
  const sub = await db.subscription.findUniqueOrThrow({
    where: { id },
    include: { plan: { select: { closable: true, pausable: true, renewable: true, billingPeriod: true } } },
  });
  if (!canRenew(sub.status, sub.plan)) throw new Error("This subscription cannot be renewed");
  const from = sub.expiryDate ?? sub.startDate;
  return db.subscription.update({
    where: { id },
    data: { expiryDate: termEnd(from, sub.plan.billingPeriod) },
  });
}

/** Close ACTIVE/PAUSED subscriptions whose plan auto-closes and whose expiry has passed. */
export async function closeExpiredSubscriptions(): Promise<number> {
  const now = new Date();
  const res = await db.subscription.updateMany({
    where: {
      status: { in: ["ACTIVE", "PAUSED"] },
      expiryDate: { lt: now },
      plan: { autoClose: true },
    },
    data: { status: "CLOSED", closedAt: now, nextInvoiceDate: null },
  });
  return res.count;
}

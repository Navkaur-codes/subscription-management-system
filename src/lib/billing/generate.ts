import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { periodRange, today } from "@/lib/dates";
import { nextNumber } from "@/lib/numbering";
import { priceLines, type DiscountRule, type PriceLineInput, type PricedTotals } from "@/lib/pricing";
import { toNum } from "@/lib/format";
import { addDays, endOfDay } from "date-fns";

export type GenerateResult =
  | { status: "created"; invoiceId: string; number: string; nextInvoiceDate: Date }
  | { status: "skipped"; reason: string; invoiceId?: string; nextInvoiceDate?: Date };

/** Thrown inside the transaction when another run used up the discount first. */
class DiscountExhausted extends Error {}

export const discountInclude = { products: true } satisfies Prisma.DiscountInclude;
export type DiscountRow = Prisma.DiscountGetPayload<{ include: typeof discountInclude }>;

function toRule(d: DiscountRow): DiscountRule {
  return { ...d, value: toNum(d.value), minPurchase: toNum(d.minPurchase), productIds: d.products.map((p) => p.productId) };
}

/** Pick the subscription's own discount, or else the best valid active discount. */
export function bestPricing(inputs: PriceLineInput[], own: DiscountRow | null, all: DiscountRow[], on: Date) {
  let best: { priced: PricedTotals; discountId: string | null } = { priced: priceLines(inputs, null, on), discountId: null };
  const candidates = own ? [own] : all;
  for (const d of candidates) {
    const priced = priceLines(inputs, toRule(d), on);
    if (priced.discountApplied && priced.discountTotal > best.priced.discountTotal) best = { priced, discountId: d.id };
  }
  return best;
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Bill the subscription's next period exactly once. Safe to call repeatedly. */
export async function generateInvoiceForSubscription(
  subscriptionId: string,
  activeDiscounts?: DiscountRow[]
): Promise<GenerateResult> {
  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: { select: { billingPeriod: true } },
      discount: { include: discountInclude },
      lines: { include: { product: { select: { name: true } } } },
    },
  });
  if (!sub) return { status: "skipped", reason: "Subscription not found" };
  if (sub.status !== "ACTIVE") return { status: "skipped", reason: "Only active subscriptions can be invoiced" };
  if (!sub.nextInvoiceDate) return { status: "skipped", reason: "No billing date scheduled" };
  if (sub.lines.length === 0) return { status: "skipped", reason: "Subscription has no order lines" };

  const { periodStart, periodEnd } = periodRange(sub.nextInvoiceDate, sub.plan.billingPeriod);
  if (sub.expiryDate && periodStart >= sub.expiryDate) return { status: "skipped", reason: "Subscription has expired" };

  const existing = await db.invoice.findUnique({
    where: { subscriptionId_periodStart: { subscriptionId: sub.id, periodStart } },
    select: { id: true },
  });
  if (existing) {
    await db.subscription.update({ where: { id: sub.id }, data: { nextInvoiceDate: periodEnd } });
    return { status: "skipped", reason: "This period is already billed", invoiceId: existing.id, nextInvoiceDate: periodEnd };
  }

  const inputs: PriceLineInput[] = sub.lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPrice: toNum(l.unitPrice),
    taxRate: toNum(l.taxRate),
  }));
  const all = activeDiscounts ?? (await db.discount.findMany({ where: { isActive: true }, include: discountInclude }));
  const { priced, discountId } = bestPricing(inputs, sub.discount, all, periodStart);

  const invoiceDate = today();
  const discountRow = discountId ? (all.find((d) => d.id === discountId) ?? sub.discount) : null;
  // Numbered outside the transaction so the counter row isn't locked for the whole insert —
  // lets bulk runs bill subscriptions in parallel. A failed insert can leave a gap in the sequence.
  const number = await nextNumber("INV");
  try {
    const inv = await db.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          number,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          status: "DRAFT",
          invoiceDate,
          dueDate: addDays(invoiceDate, sub.paymentTerms),
          periodStart,
          periodEnd,
          discountId,
          subtotal: priced.subtotal,
          discountTotal: priced.discountTotal,
          taxTotal: priced.taxTotal,
          total: priced.total,
          lines: {
            create: sub.lines.map((l, i) => ({
              productId: l.productId,
              variantId: l.variantId,
              description: l.description || l.product.name, // InvoiceDocument renders the variant itself
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountAmount: priced.lines[i].discountAmount,
              taxRate: l.taxRate,
              taxAmount: priced.lines[i].taxAmount,
              amount: priced.lines[i].amount,
            })),
          },
        },
        select: { id: true, number: true },
      });
      if (discountRow) {
        // Increment only while under the limit, so parallel runs can't overshoot it.
        const limit = discountRow.usageLimit;
        const r = await tx.discount.updateMany({
          where: { id: discountRow.id, ...(limit !== null ? { usedCount: { lt: limit } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (r.count === 0) throw new DiscountExhausted();
      }
      await tx.subscription.update({ where: { id: sub.id }, data: { nextInvoiceDate: periodEnd } });
      return created;
    });
    // keep the caller's cached discounts in sync so usage limits hold during bulk runs
    const used = discountId ? activeDiscounts?.find((d) => d.id === discountId) : undefined;
    if (used) used.usedCount++;
    return { status: "created", invoiceId: inv.id, number: inv.number, nextInvoiceDate: periodEnd };
  } catch (e) {
    if (e instanceof DiscountExhausted && discountRow) {
      // Someone else used the last redemption: mark it exhausted and bill without it.
      discountRow.usedCount = discountRow.usageLimit ?? discountRow.usedCount;
      const fallback = all.filter((d) => d.id !== discountRow.id);
      return generateInvoiceForSubscription(subscriptionId, fallback);
    }
    if (isUniqueViolation(e)) return { status: "skipped", reason: "This period is already billed" };
    throw e;
  }
}

const BATCH = 200;
const MAX_CATCH_UP = 12;
/** Subscriptions billed in parallel; each one bills in its own transaction. */
const CONCURRENCY = 8;
/** Stop before the request gets slow; the user just runs it again for the rest. */
const TIME_BUDGET_MS = 20_000;

/** Bill every ACTIVE subscription whose next invoice date is due (with catch-up, max 12 periods each). */
export async function generateDueInvoices() {
  const cutoff = endOfDay(new Date());
  const deadline = Date.now() + TIME_BUDGET_MS;
  let created = 0;
  let skipped = 0;
  let total = 0;
  let timedOut = false;
  let cursor: string | undefined;
  const discounts = await db.discount.findMany({ where: { isActive: true }, include: discountInclude });

  for (;;) {
    const subs = await db.subscription.findMany({
      where: { status: "ACTIVE", nextInvoiceDate: { lte: cutoff } },
      select: { id: true },
      orderBy: { id: "asc" },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (subs.length === 0) break;
    cursor = subs[subs.length - 1].id;

    // Catch up one subscription period by period, using the next date each invoice returns.
    const billOne = async (id: string) => {
      total++;
      for (let i = 0; i < MAX_CATCH_UP; i++) {
        const res = await generateInvoiceForSubscription(id, discounts);
        if (res.status === "created") created++;
        else {
          if (i === 0) skipped++;
          if (!res.invoiceId) break;
        }
        if (!res.nextInvoiceDate || res.nextInvoiceDate > cutoff) break;
      }
    };

    // Small worker pool over this batch; workers stop picking up new work past the deadline.
    let idx = 0;
    const worker = async () => {
      while (idx < subs.length) {
        if (Date.now() > deadline) {
          timedOut = true;
          return;
        }
        await billOne(subs[idx++].id);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, subs.length) }, worker));
    if (timedOut || subs.length < BATCH) break;
  }
  const remaining = timedOut
    ? await db.subscription.count({ where: { status: "ACTIVE", nextInvoiceDate: { lte: cutoff } } })
    : 0;
  return { created, skipped, total, remaining };
}

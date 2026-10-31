import { endOfDay } from "date-fns";
import { db } from "@/lib/db";
import { periodRange } from "@/lib/dates";
import { round2, toNum } from "@/lib/format";
import { bestPricing, discountInclude } from "./generate";

/** Priced in full up to this many subscriptions; beyond that the total is extrapolated. */
const SAMPLE = 500;

export type BillingPreview = {
  due: number; // ACTIVE subs whose next invoice date has arrived
  billable: number; // of those, not past expiry (estimated when sampled)
  expired: number;
  estimatedTotal: number; // first due period only, tax and auto-discounts included
  discounted: number;
  sampled: boolean;
};

/** Dry run of "Generate due invoices": counts and prices the next period of every due subscription. No writes. */
export async function previewDueBilling(): Promise<BillingPreview> {
  const where = { status: "ACTIVE" as const, nextInvoiceDate: { lte: endOfDay(new Date()) } };
  const [due, subs, discounts] = await Promise.all([
    db.subscription.count({ where }),
    db.subscription.findMany({
      where,
      take: SAMPLE,
      orderBy: { id: "asc" },
      select: {
        nextInvoiceDate: true,
        expiryDate: true,
        plan: { select: { billingPeriod: true } },
        discount: { include: discountInclude },
        lines: { select: { productId: true, quantity: true, unitPrice: true, taxRate: true } },
      },
    }),
    db.discount.findMany({ where: { isActive: true }, include: discountInclude }),
  ]);

  let billable = 0;
  let total = 0;
  let discounted = 0;
  for (const s of subs) {
    if (!s.nextInvoiceDate || s.lines.length === 0) continue;
    const { periodStart } = periodRange(s.nextInvoiceDate, s.plan.billingPeriod);
    if (s.expiryDate && periodStart >= s.expiryDate) continue;
    const inputs = s.lines.map((l) => ({ ...l, unitPrice: toNum(l.unitPrice), taxRate: toNum(l.taxRate) }));
    const { priced, discountId } = bestPricing(inputs, s.discount, discounts, periodStart);
    billable++;
    total += priced.total;
    if (discountId) discounted++;
  }

  const sampled = due > subs.length;
  const scale = sampled && subs.length > 0 ? due / subs.length : 1;
  const estBillable = Math.round(billable * scale);
  return {
    due,
    billable: estBillable,
    expired: due - estBillable,
    estimatedTotal: round2(total * scale),
    discounted: Math.round(discounted * scale),
    sampled,
  };
}

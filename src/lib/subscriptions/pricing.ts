import type { BillingPeriod, Discount, DiscountProduct } from "@prisma/client";
import { addPeriod } from "@/lib/dates";
import { toNum } from "@/lib/format";
import { priceLines, type DiscountRule } from "@/lib/pricing";

type DecimalLike = Parameters<typeof toNum>[0];

/** Prisma Discount (with products) → pricing DiscountRule. */
export function toDiscountRule(d: Discount & { products: DiscountProduct[] }): DiscountRule {
  return {
    ...d,
    value: toNum(d.value),
    minPurchase: toNum(d.minPurchase),
    productIds: d.products.map((p) => p.productId),
  };
}

/** Price stored subscription lines (Decimals) with an optional discount rule. */
export function priceSubscription(
  lines: { productId: string; quantity: number; unitPrice: DecimalLike; taxRate: DecimalLike }[],
  discount?: DiscountRule | null
) {
  return priceLines(
    lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: toNum(l.unitPrice),
      taxRate: toNum(l.taxRate),
    })),
    discount
  );
}

/** One subscription term: 1 year for yearly plans, else 12 periods. */
export function termEnd(start: Date, period: BillingPeriod): Date {
  return period === "YEARLY" ? addPeriod(start, period, 1) : addPeriod(start, period, 12);
}

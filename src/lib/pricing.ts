/**
 * Single source of truth for money maths. Subscriptions (B) and Invoices (C)
 * both call these so totals always match. Pure functions on plain numbers;
 * convert Prisma Decimals with toNum() before calling.
 */
import { round2 } from "./format";

export type DiscountRule = {
  id: string;
  type: "FIXED" | "PERCENT";
  value: number; // amount or percent
  scope: "PRODUCT" | "SUBSCRIPTION";
  minPurchase: number;
  minQuantity: number;
  startDate: Date | null;
  endDate: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  productIds: string[]; // only for PRODUCT scope
};

export type PriceLineInput = {
  productId: string;
  quantity: number;
  unitPrice: number; // product.salesPrice + variant.extraPrice
  taxRate: number; // percent, sum of product's active taxes
};

export type PricedLine = PriceLineInput & {
  base: number; // qty * unitPrice
  discountAmount: number;
  taxAmount: number;
  amount: number; // base - discount + tax
};

export type PricedTotals = {
  lines: PricedLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  discountApplied: boolean;
  discountReason?: string; // why it was NOT applied (for UI hints)
};

/** Unit price = product sales price + selected variant extra price. */
export function unitPrice(productSalesPrice: number, variantExtra = 0): number {
  return round2(productSalesPrice + variantExtra);
}

/** Sum of active tax rates for a product, e.g. [9, 9] → 18. */
export function sumTaxRates(taxes: { rate: number; isActive?: boolean }[]): number {
  return round2(taxes.filter((t) => t.isActive !== false).reduce((s, t) => s + t.rate, 0));
}

/** Checks validity window, usage limit and minimums. Returns null if OK, else a reason. */
export function discountBlockReason(
  d: DiscountRule,
  ctx: { subtotal: number; totalQty: number; on?: Date }
): string | null {
  const on = ctx.on ?? new Date();
  if (!d.isActive) return "Discount is inactive";
  if (d.startDate && on < d.startDate) return "Discount not started yet";
  if (d.endDate && on > d.endDate) return "Discount has expired";
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return "Discount usage limit reached";
  if (ctx.subtotal < d.minPurchase) return `Minimum purchase ${d.minPurchase} not met`;
  if (ctx.totalQty < d.minQuantity) return `Minimum quantity ${d.minQuantity} not met`;
  return null;
}

/**
 * Price a set of lines with an optional discount.
 * - PERCENT: value% off each eligible line.
 * - FIXED: value spread over eligible lines proportionally to their base, capped at base.
 * - PRODUCT scope: eligible lines are those whose productId is in discount.productIds.
 * Tax is charged on (base - discount).
 */
export function priceLines(
  inputs: PriceLineInput[],
  discount?: DiscountRule | null,
  on?: Date
): PricedTotals {
  const lines: PricedLine[] = inputs.map((l) => ({
    ...l,
    base: round2(l.quantity * l.unitPrice),
    discountAmount: 0,
    taxAmount: 0,
    amount: 0,
  }));
  const subtotal = round2(lines.reduce((s, l) => s + l.base, 0));
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);

  let discountApplied = false;
  let discountReason: string | undefined;

  if (discount) {
    const block = discountBlockReason(discount, { subtotal, totalQty, on });
    const eligible = lines.filter(
      (l) => discount.scope === "SUBSCRIPTION" || discount.productIds.includes(l.productId)
    );
    if (block) {
      discountReason = block;
    } else if (eligible.length === 0) {
      discountReason = "No eligible products for this discount";
    } else {
      discountApplied = true;
      const eligibleBase = eligible.reduce((s, l) => s + l.base, 0);
      for (const l of eligible) {
        const amt =
          discount.type === "PERCENT"
            ? (l.base * Math.min(discount.value, 100)) / 100
            : eligibleBase > 0
              ? (discount.value * l.base) / eligibleBase
              : 0;
        l.discountAmount = round2(Math.min(amt, l.base));
      }
    }
  }

  for (const l of lines) {
    const net = l.base - l.discountAmount;
    l.taxAmount = round2((net * l.taxRate) / 100);
    l.amount = round2(net + l.taxAmount);
  }

  const discountTotal = round2(lines.reduce((s, l) => s + l.discountAmount, 0));
  const taxTotal = round2(lines.reduce((s, l) => s + l.taxAmount, 0));
  const total = round2(subtotal - discountTotal + taxTotal);

  return { lines, subtotal, discountTotal, taxTotal, total, discountApplied, discountReason };
}

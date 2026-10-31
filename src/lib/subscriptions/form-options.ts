import type { BillingPeriod } from "@prisma/client";
import { db } from "@/lib/db";
import { today } from "@/lib/dates";
import { toNum } from "@/lib/format";
import { sumTaxRates, type DiscountRule } from "@/lib/pricing";
import { toDiscountRule } from "./pricing";

export type ProductOption = {
  id: string;
  name: string;
  salesPrice: number;
  taxRate: number;
  variants: { id: string; label: string; extraPrice: number }[];
};

export type FormOptions = {
  customers: { id: string; name: string; email: string }[];
  plans: { id: string; name: string; billingPeriod: BillingPeriod; minQuantity: number }[];
  products: ProductOption[];
  discounts: (DiscountRule & { name: string })[];
};

/** Everything the subscription form needs. `keepPlanId` keeps an existing (maybe expired) plan selectable. */
export async function loadFormOptions(keepPlanId?: string): Promise<FormOptions> {
  const now = today();
  const [customers, plans, products, discounts] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    db.plan.findMany({
      where: {
        OR: [
          {
            isActive: true,
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
          },
          ...(keepPlanId ? [{ id: keepPlanId }] : []),
        ],
      },
      select: { id: true, name: true, billingPeriod: true, minQuantity: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      where: { isActive: true },
      include: { variants: true, taxes: { include: { tax: true } } },
      orderBy: { name: "asc" },
    }),
    db.discount.findMany({ where: { isActive: true }, include: { products: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    customers,
    plans,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      salesPrice: toNum(p.salesPrice),
      taxRate: sumTaxRates(p.taxes.map((t) => ({ rate: toNum(t.tax.rate), isActive: t.tax.isActive }))),
      variants: p.variants.map((v) => ({
        id: v.id,
        label: `${v.attribute}: ${v.value}`,
        extraPrice: toNum(v.extraPrice),
      })),
    })),
    discounts: discounts.map((d) => ({ ...toDiscountRule(d), name: d.name })),
  };
}

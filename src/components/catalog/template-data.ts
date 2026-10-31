import { db } from "@/lib/db";
import { sumTaxRates } from "@/lib/pricing";
import { toNum } from "@/lib/format";
import type { TemplatePlan, TemplateProduct } from "./template-form";

/** Plans and products offered in the template editor (keeps already-used inactive ones selectable). */
export async function loadTemplateOptions(keepPlanId?: string, keepProductIds: string[] = []) {
  const [plans, products] = await Promise.all([
    db.plan.findMany({ where: { OR: [{ isActive: true }, ...(keepPlanId ? [{ id: keepPlanId }] : [])] }, orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { OR: [{ isActive: true }, { id: { in: keepProductIds } }] },
      orderBy: { name: "asc" },
      include: { variants: { orderBy: { createdAt: "asc" } }, taxes: { include: { tax: true } } },
    }),
  ]);
  const planOpts: TemplatePlan[] = plans.map((p) => ({ id: p.id, name: p.name, minQuantity: p.minQuantity }));
  const productOpts: TemplateProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    salesPrice: toNum(p.salesPrice),
    taxRate: sumTaxRates(p.taxes.map((t) => ({ rate: toNum(t.tax.rate), isActive: t.tax.isActive }))),
    variants: p.variants.map((x) => ({ id: x.id, label: `${x.attribute}: ${x.value}`, extraPrice: toNum(x.extraPrice) })),
  }));
  return { plans: planOpts, products: productOpts };
}

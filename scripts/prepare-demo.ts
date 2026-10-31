/**
 * Get the database ready for the demo video's billing-day scene.
 *   npm run demo:prepare            (adds 40 subscriptions)
 *   npm run demo:prepare -- 60      (adds 60)
 * Adds a batch of subscriptions that went live today, so their first invoice is due and
 * "Generate due invoices" has real work to show. Safe to run again after a rehearsal.
 */
import { endOfDay, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { priceLines, sumTaxRates, unitPrice } from "@/lib/pricing";
import { toNum } from "@/lib/format";
import { addPeriod } from "@/lib/dates";
import { nextNumber } from "@/lib/numbering";

const COUNT = Math.max(1, Math.min(200, Number(process.argv[2]) || 40));

async function main() {
  const today = startOfDay(new Date());
  const [plans, products, customers] = await Promise.all([
    db.plan.findMany({ where: { isActive: true, name: { in: ["Starter Monthly", "Business Yearly", "Flex Weekly"] } } }),
    db.product.findMany({ where: { isActive: true }, include: { variants: true, taxes: { include: { tax: true } } } }),
    db.customer.findMany({ where: { email: { endsWith: "@example.test" } }, select: { id: true }, take: 400 }),
  ]);
  if (!plans.length || !products.length || !customers.length) throw new Error("Seed data missing — run `npm run seed:bulk` first.");

  const pick = <T,>(xs: T[], i: number) => xs[(i * 7919) % xs.length];
  for (let i = 0; i < COUNT; i++) {
    const plan = pick(plans, i);
    const product = pick(products, i + 3);
    const variant = product.variants[0];
    const qty = Math.max(plan.minQuantity, [2, 5, 12, 25, 8, 15][i % 6]);
    const unit = unitPrice(toNum(product.salesPrice), variant ? toNum(variant.extraPrice) : 0);
    const taxRate = sumTaxRates(product.taxes.map((t) => ({ rate: toNum(t.tax.rate), isActive: t.tax.isActive })));
    const priced = priceLines([{ productId: product.id, quantity: qty, unitPrice: unit, taxRate }]);
    await db.subscription.create({
      data: {
        number: await nextNumber("SUB"),
        customerId: pick(customers, i + 11).id,
        planId: plan.id,
        status: "ACTIVE",
        startDate: today,
        expiryDate: addPeriod(today, plan.billingPeriod, plan.billingPeriod === "YEARLY" ? 1 : 12),
        nextInvoiceDate: today,
        paymentTerms: 15,
        notes: "Went live today",
        lines: { create: [{ productId: product.id, variantId: variant?.id, quantity: qty, unitPrice: unit, taxRate, amount: priced.subtotal }] },
      },
    });
  }
  const due = await db.subscription.count({
    where: { status: "ACTIVE", nextInvoiceDate: { lte: endOfDay(today) }, expiryDate: { gt: today } },
  });
  console.log(`Added ${COUNT} subscriptions going live today. Billable now: ${due}. "Generate due invoices" is ready for the demo.`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

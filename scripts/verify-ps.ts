/**
 * End-to-end check of the problem-statement business rules against the real code and database.
 *   npm run verify
 * Creates its own QA customer / plans / discounts, exercises pricing, discounts, lifecycle,
 * invoicing (incl. no double billing) and payments, then deletes everything it created.
 * Never touches existing data (it does not run the global billing or auto-close jobs).
 */
import { startOfDay, subDays } from "date-fns";
import { PrismaClient, type SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { priceLines, unitPrice } from "@/lib/pricing";
import { toNum } from "@/lib/format";
import { nextNumber } from "@/lib/numbering";
import { addPeriod } from "@/lib/dates";
import { displayStatus, isOverdue } from "@/lib/invoice-status";
import { changeStatus, renewSubscription } from "@/lib/subscriptions/lifecycle";
import { generateInvoiceForSubscription } from "@/lib/billing/generate";
import { recordPayment } from "@/lib/billing/payments";
import { passwordSchema } from "@/lib/validators/auth";

const tag = `qa-${Date.now()}`;
let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? `  — ${detail}` : ""}`);
};
const throws = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
};
const section = (t: string) => console.log(`\n${t}`);

async function main() {
  const crm = await db.product.findFirstOrThrow({ where: { name: "Brightloop CRM" }, include: { variants: true, taxes: { include: { tax: true } } } });
  const odoo = crm.variants.find((v) => v.value === "Odoo")!;
  const tax = crm.taxes.reduce((s, t) => s + toNum(t.tax.rate), 0);
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN" } });

  const customer = await db.customer.create({ data: { name: "QA Verify", email: `${tag}@brightloop.test` } });
  const monthly = await db.plan.create({ data: { name: `${tag} monthly`, price: 999, billingPeriod: "MONTHLY", pausable: true, closable: true, renewable: true } });
  const yearlyLocked = await db.plan.create({ data: { name: `${tag} yearly`, price: 9990, billingPeriod: "YEARLY", pausable: false, closable: false, renewable: false } });
  const seats10 = await db.discount.create({ data: { name: `${tag} 10%`, type: "PERCENT", value: 10, minQuantity: 10, usageLimit: 1 } });
  const expired = await db.discount.create({ data: { name: `${tag} expired`, type: "PERCENT", value: 50, endDate: subDays(new Date(), 3) } });

  const unit = unitPrice(toNum(crm.salesPrice), toNum(odoo.extraPrice));
  const newSub = async (planId: string, qty: number, discountId?: string) => {
    const priced = priceLines([{ productId: crm.id, quantity: qty, unitPrice: unit, taxRate: tax }]);
    return db.subscription.create({
      data: {
        number: await nextNumber("SUB"),
        customerId: customer.id,
        planId,
        startDate: startOfDay(new Date()),
        expiryDate: addPeriod(startOfDay(new Date()), "YEARLY"),
        discountId,
        lines: { create: [{ productId: crm.id, variantId: odoo.id, quantity: qty, unitPrice: unit, taxRate: tax, amount: priced.subtotal }] },
      },
    });
  };
  const activate = async (id: string) => {
    for (const s of ["QUOTATION", "CONFIRMED", "ACTIVE"] as SubscriptionStatus[]) await changeStatus(id, s);
  };

  try {
    section("Sign-up rules");
    check("password ≤ 8 chars rejected", !passwordSchema.safeParse("Ab@12345").success);
    check("password without special char rejected", !passwordSchema.safeParse("Abcdefgh1").success);
    check("password without uppercase rejected", !passwordSchema.safeParse("abcdefg@1").success);
    check("valid password accepted", passwordSchema.safeParse("Brightloop@123").success);
    // Quiet client: this insert is expected to fail, so don't log it as an error.
    const quiet = new PrismaClient({ log: [] });
    const dupe = await throws(() => quiet.customer.create({ data: { name: "dupe", email: customer.email } }));
    await quiet.$disconnect();
    check("each email belongs to one account (unique)", dupe);

    section("Products, variants & tax");
    check("variant adds to price (Odoo +560)", unit === toNum(crm.salesPrice) + 560, `₹${unit}`);
    const p = priceLines([{ productId: crm.id, quantity: 12, unitPrice: unit, taxRate: tax }]);
    check("12 seats: subtotal, tax, total", p.subtotal === 21120 && p.taxTotal === 3801.6 && p.total === 24921.6, `₹${p.subtotal} + ₹${p.taxTotal} = ₹${p.total}`);

    section("Subscription lifecycle");
    const a = await newSub(monthly.id, 12, seats10.id);
    check("starts as DRAFT with its own number", a.status === "DRAFT" && /^SUB\/\d{4}\/\d{5}$/.test(a.number), a.number);
    check("Draft → Active directly is blocked", await throws(() => changeStatus(a.id, "ACTIVE")));
    await activate(a.id);
    let sa = await db.subscription.findUniqueOrThrow({ where: { id: a.id } });
    check("Draft → Quotation → Confirmed → Active", sa.status === "ACTIVE");
    check("activation schedules the first invoice", sa.nextInvoiceDate?.getTime() === startOfDay(new Date()).getTime());
    await changeStatus(a.id, "PAUSED");
    await changeStatus(a.id, "ACTIVE");
    sa = await db.subscription.findUniqueOrThrow({ where: { id: a.id } });
    check("pausable plan: pause → resume", sa.status === "ACTIVE");
    const oldExpiry = sa.expiryDate!;
    await renewSubscription(a.id);
    sa = await db.subscription.findUniqueOrThrow({ where: { id: a.id } });
    check("renewable plan: renew extends expiry", sa.expiryDate! > oldExpiry);

    const locked = await newSub(yearlyLocked.id, 2);
    await activate(locked.id);
    check("non-pausable plan cannot be paused", await throws(() => changeStatus(locked.id, "PAUSED")));
    check("non-closable plan cannot be closed early", await throws(() => changeStatus(locked.id, "CLOSED")));
    check("non-renewable plan cannot be renewed", await throws(() => renewSubscription(locked.id)));

    section("Billing day: invoices from subscriptions");
    const first = await generateInvoiceForSubscription(a.id);
    check("invoice generated from subscription", first.status === "created");
    const inv = await db.invoice.findUniqueOrThrow({ where: { id: first.status === "created" ? first.invoiceId : "" }, include: { lines: true } });
    check("customer, lines and period filled in", inv.customerId === customer.id && inv.lines.length === 1 && !!inv.periodStart && !!inv.periodEnd);
    check("discount applied automatically (10% of ₹21,120)", toNum(inv.discountTotal) === 2112, `−₹${toNum(inv.discountTotal)}`);
    check("tax charged on discounted amount", toNum(inv.taxTotal) === 3421.44 && toNum(inv.total) === 22429.44, `₹${toNum(inv.taxTotal)} tax, ₹${toNum(inv.total)} total`);
    check("starts as DRAFT, due per payment terms", inv.status === "DRAFT" && inv.dueDate > inv.invoiceDate);
    sa = await db.subscription.findUniqueOrThrow({ where: { id: a.id } });
    check("next invoice date advances one period", sa.nextInvoiceDate?.getTime() === inv.periodEnd?.getTime());

    // Rewind the schedule and bill again: the same period must not be billed twice.
    await db.subscription.update({ where: { id: a.id }, data: { nextInvoiceDate: inv.periodStart } });
    const again = await generateInvoiceForSubscription(a.id);
    const count = await db.invoice.count({ where: { subscriptionId: a.id, periodStart: inv.periodStart } });
    check("same period is never billed twice", again.status === "skipped" && count === 1);

    section("Discount rules");
    const used = await db.discount.findUniqueOrThrow({ where: { id: seats10.id } });
    check("usage counted when applied", used.usedCount === 1);
    const b = await newSub(monthly.id, 12, seats10.id);
    await activate(b.id);
    const bInv = await generateInvoiceForSubscription(b.id);
    const bRow = await db.invoice.findUniqueOrThrow({ where: { id: bInv.status === "created" ? bInv.invoiceId : "" } });
    check("stops when usage limit is reached", toNum(bRow.discountTotal) === 0);
    const c = await newSub(monthly.id, 12, expired.id);
    await activate(c.id);
    const cInv = await generateInvoiceForSubscription(c.id);
    const cRow = await db.invoice.findUniqueOrThrow({ where: { id: cInv.status === "created" ? cInv.invoiceId : "" } });
    check("expired discount is not applied", toNum(cRow.discountTotal) === 0);
    const small = priceLines([{ productId: crm.id, quantity: 5, unitPrice: unit, taxRate: tax }], {
      ...seats10, value: 10, minPurchase: 0, productIds: [], usedCount: 0,
    });
    check("minimum quantity enforced (5 < 10 seats)", !small.discountApplied, small.discountReason);

    section("Payments");
    check("draft invoice cannot take payments", await throws(() => recordPayment({ invoiceId: inv.id, method: "UPI", amount: 100, paymentDate: new Date() }, admin.id)));
    await db.invoice.update({ where: { id: inv.id }, data: { status: "CONFIRMED" } });
    await recordPayment({ invoiceId: inv.id, method: "BANK_TRANSFER", amount: 10000, paymentDate: new Date(), note: "QA partial" }, admin.id);
    let pinv = await db.invoice.findUniqueOrThrow({ where: { id: inv.id } });
    check("partial payment → Partial", displayStatus(pinv) === "PARTIAL" && toNum(pinv.amountPaid) === 10000);
    check("overpayment is blocked", await throws(() => recordPayment({ invoiceId: inv.id, method: "CASH", amount: 999999, paymentDate: new Date() }, admin.id)));
    await recordPayment({ invoiceId: inv.id, method: "UPI", amount: 12429.44, paymentDate: new Date() }, admin.id);
    pinv = await db.invoice.findUniqueOrThrow({ where: { id: inv.id } });
    check("full payment → Paid automatically", pinv.status === "PAID" && !!pinv.paidAt);
    await db.invoice.update({ where: { id: bRow.id }, data: { status: "CONFIRMED", dueDate: subDays(new Date(), 1) } });
    const od = await db.invoice.findUniqueOrThrow({ where: { id: bRow.id } });
    check("unpaid past due date → Overdue", isOverdue(od) && displayStatus(od) === "OVERDUE");

    section("Closing");
    await changeStatus(a.id, "CLOSED");
    sa = await db.subscription.findUniqueOrThrow({ where: { id: a.id } });
    check("close stops future billing", sa.status === "CLOSED" && sa.nextInvoiceDate === null && !!sa.closedAt);
    check("closed subscription cannot be reactivated", await throws(() => changeStatus(a.id, "ACTIVE")));

    section("Numbering");
    const nums = await Promise.all(Array.from({ length: 8 }, () => nextNumber("INV")));
    check("concurrent invoice numbers are unique", new Set(nums).size === nums.length);
  } finally {
    // Clean up everything this run created.
    const subs = await db.subscription.findMany({ where: { customerId: customer.id }, select: { id: true } });
    const ids = subs.map((s) => s.id);
    await db.payment.deleteMany({ where: { invoice: { customerId: customer.id } } });
    await db.invoiceLine.deleteMany({ where: { invoice: { customerId: customer.id } } });
    await db.invoice.deleteMany({ where: { customerId: customer.id } });
    await db.subscriptionLine.deleteMany({ where: { subscriptionId: { in: ids } } });
    await db.subscription.deleteMany({ where: { id: { in: ids } } });
    await db.discount.deleteMany({ where: { name: { startsWith: tag } } });
    await db.plan.deleteMany({ where: { name: { startsWith: tag } } });
    await db.customer.delete({ where: { id: customer.id } });
    await db.$disconnect();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

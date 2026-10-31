/**
 * npm run seed            → wipes data, creates demo catalog, 3 logins, ~12 customers, a few subscriptions/invoices
 * SEED_BULK=5000 npm run seed → also creates 5000 subscriptions with invoice/payment history (perf demo)
 */
import { PrismaClient, type BillingPeriod, type InvoiceStatus, type SubscriptionStatus } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/en_IN";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { addDays, startOfDay, subDays, subMonths } from "date-fns";
import { addPeriod } from "../src/lib/dates";
import { priceLines } from "../src/lib/pricing";

const db = new PrismaClient();
faker.seed(42);

async function wipe() {
  await db.payment.deleteMany();
  await db.invoiceLine.deleteMany();
  await db.invoice.deleteMany();
  await db.subscriptionLine.deleteMany();
  await db.subscription.deleteMany();
  await db.quotationTemplateLine.deleteMany();
  await db.quotationTemplate.deleteMany();
  await db.discountProduct.deleteMany();
  await db.discount.deleteMany();
  await db.productTax.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.tax.deleteMany();
  await db.plan.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.customer.deleteMany();
  await db.user.deleteMany();
  await db.sequence.deleteMany();
}

async function main() {
  await wipe();
  const hash = await bcrypt.hash("Brightloop@123", 10);

  // ── Users (all share password Brightloop@123) ──
  await db.user.create({ data: { name: "Aarav Admin", email: "admin@brightloop.test", passwordHash: hash, role: "ADMIN" } });
  await db.user.create({ data: { name: "Sana Staff", email: "staff@brightloop.test", passwordHash: hash, role: "STAFF" } });
  const custUser = await db.user.create({
    data: { name: "Kiran Customer", email: "customer@brightloop.test", passwordHash: hash, role: "CUSTOMER" },
  });

  // ── Taxes ──
  const gst18 = await db.tax.create({ data: { name: "GST 18%", rate: 18 } });
  const gst5 = await db.tax.create({ data: { name: "GST 5%", rate: 5 } });
  await db.tax.create({ data: { name: "GST 12% (inactive)", rate: 12, isActive: false } });

  // ── Products & variants ──
  const crm = await db.product.create({
    data: {
      name: "Brightloop CRM",
      type: "SERVICE",
      salesPrice: 1200,
      costPrice: 300,
      notes: "Per-seat CRM licence",
      taxes: { create: [{ taxId: gst18.id }] },
      variants: {
        create: [
          { attribute: "Brand", value: "Odoo", extraPrice: 560 },
          { attribute: "Brand", value: "Standard", extraPrice: 0 },
        ],
      },
    },
    include: { variants: true },
  });
  const analytics = await db.product.create({
    data: { name: "Analytics add-on", salesPrice: 450, costPrice: 90, taxes: { create: [{ taxId: gst18.id }] } },
  });
  const support = await db.product.create({
    data: {
      name: "Priority support",
      salesPrice: 2500,
      costPrice: 1200,
      taxes: { create: [{ taxId: gst18.id }] },
      variants: { create: [{ attribute: "Tier", value: "24x7", extraPrice: 1500 }] },
    },
  });
  const token = await db.product.create({
    data: { name: "Hardware security key", type: "GOODS", salesPrice: 1800, costPrice: 1100, taxes: { create: [{ taxId: gst5.id }] } },
  });
  const products = [crm, analytics, support, token];
  const productTax: Record<string, number> = { [crm.id]: 18, [analytics.id]: 18, [support.id]: 18, [token.id]: 5 };

  // ── Plans ──
  const monthly = await db.plan.create({
    data: { name: "Starter Monthly", price: 999, billingPeriod: "MONTHLY", minQuantity: 1, pausable: true, renewable: true, closable: true },
  });
  const yearly = await db.plan.create({
    data: { name: "Business Yearly", price: 9990, billingPeriod: "YEARLY", minQuantity: 5, pausable: false, renewable: true, closable: true },
  });
  const weekly = await db.plan.create({
    data: { name: "Flex Weekly", price: 299, billingPeriod: "WEEKLY", minQuantity: 1, autoClose: true },
  });
  const trial = await db.plan.create({
    data: {
      name: "Daily Trial",
      price: 0,
      billingPeriod: "DAILY",
      startDate: subMonths(new Date(), 1),
      endDate: addDays(new Date(), 60),
      autoClose: true,
      pausable: false,
      renewable: false,
    },
  });
  const plans = [monthly, yearly, weekly];

  // ── Discounts ──
  const bulk = await db.discount.create({
    data: { name: "Bulk seats 10%", code: "SEATS10", type: "PERCENT", value: 10, scope: "SUBSCRIPTION", minQuantity: 10, usageLimit: 100 },
  });
  await db.discount.create({
    data: {
      name: "Analytics launch ₹200 off",
      code: "ANALYTICS200",
      type: "FIXED",
      value: 200,
      scope: "PRODUCT",
      endDate: addDays(new Date(), 30),
      usageLimit: 50,
      products: { create: [{ productId: analytics.id }] },
    },
  });
  await db.discount.create({
    data: { name: "Diwali 15% (expired)", type: "PERCENT", value: 15, endDate: subMonths(new Date(), 1) },
  });

  // ── Quotation templates ──
  await db.quotationTemplate.create({
    data: {
      name: "Enterprise CRM bundle",
      validityDays: 30,
      planId: yearly.id,
      paymentTerms: 30,
      lines: {
        create: [
          { productId: crm.id, variantId: crm.variants[0].id, quantity: 25 },
          { productId: analytics.id, quantity: 25 },
          { productId: support.id, quantity: 1 },
        ],
      },
    },
  });
  await db.quotationTemplate.create({
    data: {
      name: "Small shop starter",
      validityDays: 14,
      planId: monthly.id,
      lines: { create: [{ productId: crm.id, variantId: crm.variants[1].id, quantity: 2 }] },
    },
  });

  // ── Customers ──
  const kiran = await db.customer.create({
    data: { name: "Kiran Customer", email: custUser.email, company: "Kiran Traders", city: "Pune", userId: custUser.id },
  });
  const customers = [kiran];
  for (let i = 0; i < 11; i++) {
    customers.push(
      await db.customer.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase().replace("@", `+${i}@`),
          company: faker.company.name(),
          phone: faker.phone.number(),
          city: faker.location.city(),
        },
      })
    );
  }

  // ── Demo subscriptions (small set, created via the same pricing maths) ──
  let subSeq = 0;
  let invSeq = 0;
  const year = new Date().getFullYear();
  const subNo = () => `SUB/${year}/${String(++subSeq).padStart(5, "0")}`;
  const invNo = () => `INV/${year}/${String(++invSeq).padStart(5, "0")}`;

  const demo: { customerId: string; planId: string; status: SubscriptionStatus; monthsAgo: number; qty: number; withAnalytics?: boolean }[] = [
    { customerId: kiran.id, planId: monthly.id, status: "ACTIVE", monthsAgo: 3, qty: 2, withAnalytics: true },
    { customerId: kiran.id, planId: yearly.id, status: "QUOTATION", monthsAgo: 0, qty: 12 },
    { customerId: customers[1].id, planId: monthly.id, status: "ACTIVE", monthsAgo: 2, qty: 12 },
    { customerId: customers[2].id, planId: yearly.id, status: "ACTIVE", monthsAgo: 5, qty: 10 },
    { customerId: customers[3].id, planId: monthly.id, status: "PAUSED", monthsAgo: 4, qty: 3 },
    { customerId: customers[4].id, planId: weekly.id, status: "CONFIRMED", monthsAgo: 0, qty: 1 },
    { customerId: customers[5].id, planId: monthly.id, status: "DRAFT", monthsAgo: 0, qty: 4 },
    { customerId: customers[6].id, planId: monthly.id, status: "CLOSED", monthsAgo: 8, qty: 2 },
    { customerId: customers[7].id, planId: trial.id, status: "ACTIVE", monthsAgo: 0, qty: 1 },
  ];

  for (const d of demo) {
    const plan = [...plans, trial].find((p) => p.id === d.planId)!;
    const start = startOfDay(subMonths(new Date(), d.monthsAgo));
    const lineInputs = [
      { productId: crm.id, variantId: crm.variants[0].id, quantity: d.qty, unitPrice: 1200 + 560, taxRate: 18 },
      ...(d.withAnalytics ? [{ productId: analytics.id, variantId: null, quantity: d.qty, unitPrice: 450, taxRate: 18 }] : []),
    ];
    const priced = priceLines(lineInputs);
    // next invoice = first period boundary after today for billed subs, start for unbilled
    let next = start;
    const invoices: { start: Date; end: Date }[] = [];
    if (d.status === "ACTIVE" || d.status === "PAUSED" || d.status === "CLOSED") {
      while (next <= new Date() && invoices.length < 12) {
        const end = addPeriod(next, plan.billingPeriod);
        invoices.push({ start: next, end });
        next = end;
      }
    }
    const sub = await db.subscription.create({
      data: {
        number: subNo(),
        customerId: d.customerId,
        planId: d.planId,
        status: d.status,
        startDate: start,
        expiryDate: addPeriod(start, plan.billingPeriod as BillingPeriod, plan.billingPeriod === "YEARLY" ? 1 : 12),
        nextInvoiceDate: d.status === "CLOSED" ? null : next,
        paymentTerms: 15,
        closedAt: d.status === "CLOSED" ? new Date() : null,
        lines: {
          create: lineInputs.map((l, i) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            amount: priced.lines[i].base,
          })),
        },
      },
    });
    for (const [idx, p] of invoices.entries()) {
      const isLast = idx === invoices.length - 1;
      const due = addDays(p.start, 15);
      const status: InvoiceStatus = isLast && due > new Date() ? "CONFIRMED" : isLast ? "CONFIRMED" : "PAID";
      const inv = await db.invoice.create({
        data: {
          number: invNo(),
          subscriptionId: sub.id,
          customerId: d.customerId,
          status,
          invoiceDate: p.start,
          dueDate: due,
          periodStart: p.start,
          periodEnd: p.end,
          subtotal: priced.subtotal,
          discountTotal: priced.discountTotal,
          taxTotal: priced.taxTotal,
          total: priced.total,
          amountPaid: status === "PAID" ? priced.total : 0,
          paidAt: status === "PAID" ? addDays(p.start, 5) : null,
          lines: {
            create: priced.lines.map((l, i) => ({
              productId: l.productId,
              variantId: lineInputs[i].variantId,
              description: products.find((x) => x.id === l.productId)!.name,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountAmount: l.discountAmount,
              taxRate: l.taxRate,
              taxAmount: l.taxAmount,
              amount: l.amount,
            })),
          },
        },
      });
      if (status === "PAID")
        await db.payment.create({
          data: { invoiceId: inv.id, method: "UPI", amount: priced.total, paymentDate: addDays(p.start, 5), note: "Seed payment" },
        });
    }
  }
  void bulk;

  // ── Optional bulk data for performance demo ──
  const N = Number(process.env.SEED_BULK ?? 0);
  if (N > 0) {
    console.log(`Bulk seeding ${N} subscriptions…`);
    const bulkCustomers = Array.from({ length: Math.ceil(N / 4) }, (_, i) => ({
      id: randomUUID(),
      name: faker.person.fullName(),
      email: `bulk${i}@example.test`,
      company: faker.company.name(),
      city: faker.location.city(),
    }));
    await db.customer.createMany({ data: bulkCustomers });

    // Paid 3 days after issue, but never in the future.
    const paidOn = (issued: Date) => new Date(Math.min(addDays(issued, 3).getTime(), Date.now()));
    const statuses: SubscriptionStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "PAUSED", "CLOSED", "QUOTATION", "DRAFT", "CONFIRMED"];
    const subs: object[] = [];
    const subLines: object[] = [];
    const invs: object[] = [];
    const invLines: object[] = [];
    const pays: object[] = [];

    for (let i = 0; i < N; i++) {
      const plan = faker.helpers.arrayElement(plans);
      const product = faker.helpers.arrayElement(products);
      const qty = faker.number.int({ min: plan.minQuantity, max: 30 });
      const status = faker.helpers.arrayElement(statuses);
      // Growth story: sign-ups skew toward recent months; churned subs close at a random point after start.
      const start = startOfDay(subDays(new Date(), Math.floor(365 * faker.number.float() ** 1.8)));
      const closedAt = status === "CLOSED" ? new Date(start.getTime() + faker.number.float() * (Date.now() - start.getTime())) : null;
      const billUntil = closedAt ?? new Date();
      const unit = Number(product.salesPrice);
      const priced = priceLines([{ productId: product.id, quantity: qty, unitPrice: unit, taxRate: productTax[product.id] }]);
      const subId = randomUUID();
      const customerId = faker.helpers.arrayElement(bulkCustomers).id;
      const billed = status === "ACTIVE" || status === "PAUSED" || status === "CLOSED";
      // Invoice history = the most recent 6 periods (older ones count as billed but aren't stored).
      const periodStarts: Date[] = [];
      for (let p = start; billed && p <= billUntil && periodStarts.length < 400; p = addPeriod(p, plan.billingPeriod)) periodStarts.push(p);
      let next = periodStarts.length ? addPeriod(periodStarts[periodStarts.length - 1], plan.billingPeriod) : start;
      for (const ps of periodStarts.slice(-6)) {
        const end = addPeriod(ps, plan.billingPeriod);
        const due = addDays(ps, 15);
        const roll = faker.number.float();
        // Older invoices are almost always settled; recent ones are still being collected.
        const old = due < subDays(new Date(), 30);
        const invStatus: InvoiceStatus = old
          ? roll < 0.96 ? "PAID" : roll < 0.99 ? "CONFIRMED" : "CANCELLED"
          : roll < 0.7 ? "PAID" : roll < 0.97 ? "CONFIRMED" : "CANCELLED";
        const invId = randomUUID();
        invs.push({
          id: invId, number: invNo(), subscriptionId: subId, customerId, status: invStatus,
          invoiceDate: ps, dueDate: due, periodStart: ps, periodEnd: end,
          subtotal: priced.subtotal, taxTotal: priced.taxTotal, total: priced.total,
          amountPaid: invStatus === "PAID" ? priced.total : 0, paidAt: invStatus === "PAID" ? paidOn(ps) : null,
        });
        invLines.push({
          id: randomUUID(), invoiceId: invId, productId: product.id, description: product.name, quantity: qty,
          unitPrice: unit, taxRate: priced.lines[0].taxRate, taxAmount: priced.lines[0].taxAmount, amount: priced.lines[0].amount,
        });
        if (invStatus === "PAID")
          pays.push({
            id: randomUUID(), invoiceId: invId, amount: priced.total, paymentDate: paidOn(ps),
            method: faker.helpers.arrayElement(["CASH", "BANK_TRANSFER", "CARD", "UPI", "CHEQUE"]),
          });
      }
      // Leave ~3% of active subs due today — a realistic billing day for the demo.
      if (status === "ACTIVE" && faker.number.float() < 0.03) next = startOfDay(new Date());
      subs.push({
        id: subId, number: subNo(), customerId, planId: plan.id, status, startDate: start,
        expiryDate: addPeriod(start, plan.billingPeriod, plan.billingPeriod === "YEARLY" ? 1 : 12),
        nextInvoiceDate: status === "CLOSED" ? null : next, closedAt,
      });
      subLines.push({
        id: randomUUID(), subscriptionId: subId, productId: product.id, quantity: qty, unitPrice: unit,
        taxRate: productTax[product.id], amount: priced.subtotal,
      });
    }
    const chunk = async <T,>(rows: T[], fn: (c: T[]) => Promise<unknown>) => {
      for (let i = 0; i < rows.length; i += 1000) await fn(rows.slice(i, i + 1000));
    };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    await chunk(subs, (c) => db.subscription.createMany({ data: c as any }));
    await chunk(subLines, (c) => db.subscriptionLine.createMany({ data: c as any }));
    await chunk(invs, (c) => db.invoice.createMany({ data: c as any }));
    await chunk(invLines, (c) => db.invoiceLine.createMany({ data: c as any }));
    await chunk(pays, (c) => db.payment.createMany({ data: c as any }));
    /* eslint-enable @typescript-eslint/no-explicit-any */
    console.log(`  ${subs.length} subscriptions, ${invs.length} invoices, ${pays.length} payments`);
  }

  await db.sequence.createMany({
    data: [
      { key: `SUB-${year}`, value: subSeq },
      { key: `INV-${year}`, value: invSeq },
    ],
  });

  console.log("Seed done. Logins (password Brightloop@123): admin@ / staff@ / customer@brightloop.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

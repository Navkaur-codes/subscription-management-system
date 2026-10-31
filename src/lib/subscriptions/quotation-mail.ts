import { db } from "@/lib/db";
import { emailLayout, sendMail } from "@/lib/mail";
import { formatDate, formatMoney } from "@/lib/format";
import { priceSubscription, toDiscountRule } from "./pricing";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const td = "padding:6px 8px;border-bottom:1px solid #e4e4e7";

/** Email a quotation summary (lines, totals, validity) to the subscription's customer. */
export async function sendQuotationEmail(id: string) {
  const sub = await db.subscription.findUniqueOrThrow({
    where: { id },
    include: {
      customer: { select: { name: true, email: true } },
      plan: { select: { name: true, billingPeriod: true } },
      discount: { include: { products: true } },
      lines: { include: { product: { select: { name: true } }, variant: { select: { value: true } } } },
    },
  });
  if (sub.status !== "QUOTATION") throw new Error("Only quotations can be emailed");

  const priced = priceSubscription(sub.lines, sub.discount ? toDiscountRule(sub.discount) : null);
  const rows = sub.lines
    .map((l, i) => {
      const name = esc(l.product.name + (l.variant ? ` (${l.variant.value})` : ""));
      return `<tr><td style="${td}">${name}</td><td style="${td};text-align:right">${l.quantity}</td><td style="${td};text-align:right">${formatMoney(priced.lines[i].amount)}</td></tr>`;
    })
    .join("");
  const totals = [
    ["Subtotal", priced.subtotal],
    ...(priced.discountTotal ? [["Discount", -priced.discountTotal] as const] : []),
    ["Tax", priced.taxTotal],
    ["Total", priced.total],
  ]
    .map(([k, v]) => `<tr><td colspan="2" style="padding:4px 8px;text-align:right">${k}</td><td style="padding:4px 8px;text-align:right">${formatMoney(v)}</td></tr>`)
    .join("");

  const html = emailLayout(
    `Quotation ${sub.number}`,
    `<p>Hi ${esc(sub.customer.name)},</p>
     <p>Here is your quotation for the <b>${esc(sub.plan.name)}</b> plan (billed ${sub.plan.billingPeriod.toLowerCase()}), starting ${formatDate(sub.startDate)}.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><th style="${td};text-align:left">Item</th><th style="${td};text-align:right">Qty</th><th style="${td};text-align:right">Amount</th></tr>
       ${rows}${totals}
     </table>
     <p>${sub.quotationExpiry ? `This quotation is valid until ${formatDate(sub.quotationExpiry)}.` : ""} Payment terms: ${sub.paymentTerms} days.</p>`
  );
  const res = await sendMail({ to: sub.customer.email, subject: `Quotation ${sub.number} from Brightloop`, html });
  return { ...res, to: sub.customer.email };
}

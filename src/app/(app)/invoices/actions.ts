"use server";
import { revalidatePath } from "next/cache";
import type { InvoiceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fail, ok, toFail, type ActionResult } from "@/lib/action";
import { INVOICE_TRANSITIONS } from "@/lib/invoice-status";
import { emailLayout, sendMail } from "@/lib/mail";
import { formatDate, formatMoney } from "@/lib/format";
import { generateDueInvoices } from "@/lib/billing/generate";
import { recordPayment } from "@/lib/billing/payments";
import { previewDueBilling, type BillingPreview } from "@/lib/billing/preview";
import type { PaymentInput } from "@/lib/validators/billing";

function refresh(id?: string) {
  revalidatePath("/invoices");
  revalidatePath("/payments");
  if (id) revalidatePath(`/invoices/${id}`);
}

export async function generateDueAction(): Promise<ActionResult<{ created: number }>> {
  try {
    await requireRole("ADMIN", "STAFF");
    const r = await generateDueInvoices();
    refresh();
    revalidatePath("/subscriptions");
    const msg =
      (r.created === 0 ? "Nothing due — no invoices created" : `${r.created} invoice${r.created === 1 ? "" : "s"} created`) +
      (r.remaining > 0 ? ` · ${r.remaining} subscriptions still due, run again to continue` : "");
    return ok({ created: r.created }, msg);
  } catch (e) {
    return toFail(e);
  }
}

export async function previewBillingAction(): Promise<ActionResult<BillingPreview>> {
  try {
    await requireRole("ADMIN", "STAFF");
    return ok(await previewDueBilling());
  } catch (e) {
    return toFail(e);
  }
}

async function transition(id: string, to: InvoiceStatus): Promise<ActionResult> {
  const inv = await db.invoice.findUnique({ where: { id }, select: { status: true, _count: { select: { payments: true } } } });
  if (!inv) return fail("Invoice not found");
  if (!INVOICE_TRANSITIONS[inv.status].includes(to)) return fail(`Cannot move a ${inv.status.toLowerCase()} invoice to ${to.toLowerCase()}`);
  if (to === "CANCELLED" && inv._count.payments > 0) return fail("Invoices with payments cannot be cancelled");
  // conditional update guards against a concurrent status change
  const res = await db.invoice.updateMany({ where: { id, status: inv.status }, data: { status: to } });
  if (res.count === 0) return fail("Invoice changed meanwhile — refresh and try again");
  refresh(id);
  return ok(undefined, to === "CONFIRMED" ? "Invoice confirmed" : "Invoice cancelled");
}

export async function confirmInvoice(id: string) {
  try {
    await requireRole("ADMIN", "STAFF");
    return await transition(id, "CONFIRMED");
  } catch (e) {
    return toFail(e);
  }
}

export async function cancelInvoice(id: string) {
  try {
    await requireRole("ADMIN", "STAFF");
    return await transition(id, "CANCELLED");
  } catch (e) {
    return toFail(e);
  }
}

export async function sendInvoice(id: string): Promise<ActionResult<{ previewUrl?: string }>> {
  try {
    await requireRole("ADMIN", "STAFF");
    const inv = await db.invoice.findUnique({ where: { id }, include: { customer: { select: { name: true, email: true } } } });
    if (!inv) return fail("Invoice not found");
    if (inv.status === "DRAFT" || inv.status === "CANCELLED") return fail("Confirm the invoice before sending it");
    const html = emailLayout(
      `Invoice ${inv.number}`,
      `<p style="color:#3f3f46">Hi ${inv.customer.name},</p>
       <p style="color:#3f3f46">Please find your invoice summary below.</p>
       <table style="width:100%;font-size:14px;color:#18181b;border-collapse:collapse">
         <tr><td style="padding:6px 0">Invoice</td><td style="text-align:right">${inv.number}</td></tr>
         <tr><td style="padding:6px 0">Invoice date</td><td style="text-align:right">${formatDate(inv.invoiceDate)}</td></tr>
         <tr><td style="padding:6px 0">Due date</td><td style="text-align:right">${formatDate(inv.dueDate)}</td></tr>
         <tr><td style="padding:6px 0;font-weight:600">Total</td><td style="text-align:right;font-weight:600">${formatMoney(inv.total)}</td></tr>
         <tr><td style="padding:6px 0">Paid</td><td style="text-align:right">${formatMoney(inv.amountPaid)}</td></tr>
       </table>`
    );
    const mail = await sendMail({ to: inv.customer.email, subject: `Invoice ${inv.number} from Brightloop`, html });
    if (!mail.ok) return fail(mail.error ?? "Could not send email");
    await db.invoice.update({ where: { id }, data: { sentAt: new Date() } });
    refresh(id);
    return ok({ previewUrl: mail.previewUrl }, `Invoice sent to ${inv.customer.email}`);
  } catch (e) {
    return toFail(e);
  }
}

export async function registerPayment(input: PaymentInput): Promise<ActionResult<{ settled: boolean }>> {
  try {
    const session = await requireRole("ADMIN", "STAFF");
    const r = await recordPayment(input, session.userId);
    refresh(input.invoiceId);
    return ok(r, r.settled ? "Payment recorded — invoice paid" : "Partial payment recorded");
  } catch (e) {
    return toFail(e);
  }
}

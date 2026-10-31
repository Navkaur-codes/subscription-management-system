import { db } from "@/lib/db";
import { outstanding } from "@/lib/invoice-status";
import { formatMoney, round2, toNum } from "@/lib/format";
import { paymentSchema, type PaymentInput } from "@/lib/validators/billing";

/** Record a payment against a CONFIRMED invoice; marks it PAID once fully settled. */
export async function recordPayment(input: PaymentInput, recordedById: string) {
  const data = paymentSchema.parse(input);
  const amount = round2(data.amount);

  return db.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({
      where: { id: data.invoiceId },
      select: { id: true, status: true, dueDate: true, total: true, amountPaid: true },
    });
    if (!inv) throw new Error("Invoice not found");
    if (inv.status !== "CONFIRMED") throw new Error("Payments can only be registered on confirmed invoices");
    const due = outstanding(inv);
    if (amount > due) throw new Error(`Amount exceeds outstanding balance of ${formatMoney(due)}`);

    await tx.payment.create({
      data: {
        invoiceId: inv.id,
        method: data.method,
        amount,
        paymentDate: data.paymentDate,
        note: data.note || null,
        reference: data.reference || null,
        recordedById,
      },
    });
    const paid = round2(toNum(inv.amountPaid) + amount);
    const settled = paid >= toNum(inv.total);
    await tx.invoice.update({
      where: { id: inv.id },
      data: { amountPaid: paid, ...(settled ? { status: "PAID", paidAt: new Date() } : {}) },
    });
    return { settled };
  });
}

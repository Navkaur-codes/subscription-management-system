"use server";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fail, ok, toFail, type ActionResult } from "@/lib/action";
import { nextNumber } from "@/lib/numbering";
import { subscriptionSchema } from "@/lib/validators/subscription";
import { changeStatus, closeExpiredSubscriptions, renewSubscription } from "@/lib/subscriptions/lifecycle";
import { sendQuotationEmail } from "@/lib/subscriptions/quotation-mail";

const STAFF = ["ADMIN", "STAFF"] as const;

/** Create (id = null) or update a DRAFT/QUOTATION subscription. Returns the id. */
export async function saveSubscription(id: string | null, input: unknown): Promise<ActionResult<string>> {
  try {
    const user = await requireRole(...STAFF);
    const v = subscriptionSchema.parse(input);

    const plan = await db.plan.findUnique({ where: { id: v.planId } });
    if (!plan || !plan.isActive) return fail("Plan is not available", { planId: "Plan is not available" });
    const totalQty = v.lines.reduce((s, l) => s + l.quantity, 0);
    if (totalQty < plan.minQuantity)
      return fail(`This plan needs a total quantity of at least ${plan.minQuantity}`);

    const lines = v.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId || null,
      description: l.description || null,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      amount: Math.round(l.quantity * l.unitPrice * 100) / 100,
    }));
    const data = {
      customerId: v.customerId,
      planId: v.planId,
      startDate: v.startDate,
      expiryDate: v.expiryDate,
      quotationExpiry: v.quotationExpiry ?? null,
      paymentTerms: v.paymentTerms,
      discountId: v.discountId || null,
      notes: v.notes || null,
    };

    const saved = await db.$transaction(async (tx) => {
      if (id) {
        const cur = await tx.subscription.findUniqueOrThrow({ where: { id }, select: { status: true } });
        if (cur.status !== "DRAFT" && cur.status !== "QUOTATION")
          throw new Error("Only draft or quotation subscriptions can be edited");
        await tx.subscriptionLine.deleteMany({ where: { subscriptionId: id } });
        return tx.subscription.update({ where: { id }, data: { ...data, lines: { create: lines } } });
      }
      const number = await nextNumber("SUB", tx);
      return tx.subscription.create({
        data: { ...data, number, createdById: user.userId, lines: { create: lines } },
      });
    });

    revalidatePath("/subscriptions");
    return ok(saved.id, id ? "Subscription updated" : `Subscription ${saved.number} created`);
  } catch (e) {
    return toFail(e);
  }
}

export async function changeStatusAction(id: string, to: SubscriptionStatus): Promise<ActionResult> {
  try {
    await requireRole(...STAFF);
    await changeStatus(id, to);
    revalidatePath("/subscriptions");
    revalidatePath(`/subscriptions/${id}`);
    return ok(undefined, `Status changed to ${to.toLowerCase()}`);
  } catch (e) {
    return toFail(e);
  }
}

export async function renewAction(id: string): Promise<ActionResult> {
  try {
    await requireRole(...STAFF);
    await renewSubscription(id);
    revalidatePath(`/subscriptions/${id}`);
    return ok(undefined, "Subscription renewed");
  } catch (e) {
    return toFail(e);
  }
}

export async function closeExpiredAction(): Promise<ActionResult<number>> {
  try {
    await requireRole(...STAFF);
    const count = await closeExpiredSubscriptions();
    revalidatePath("/subscriptions");
    return ok(count, count ? `Closed ${count} expired subscription${count > 1 ? "s" : ""}` : "Nothing to close");
  } catch (e) {
    return toFail(e);
  }
}

export async function emailQuotationAction(id: string): Promise<ActionResult<string | undefined>> {
  try {
    await requireRole(...STAFF);
    const res = await sendQuotationEmail(id);
    if (!res.ok) return fail(res.error ?? "Could not send email");
    return ok(res.previewUrl, `Quotation emailed to ${res.to}`);
  } catch (e) {
    return toFail(e);
  }
}

"use server";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fail, ok, toFail, type ActionResult } from "@/lib/action";
import { transitionBlockReason } from "@/lib/subscription-status";

async function move(id: string, to: SubscriptionStatus): Promise<ActionResult> {
  try {
    const s = await requireRole("CUSTOMER");
    if (!s.customerId) return fail("No customer profile linked to this account");
    const sub = await db.subscription.findFirst({
      where: { id, customerId: s.customerId },
      include: { plan: { select: { closable: true, pausable: true, renewable: true } } },
    });
    if (!sub) return fail("Subscription not found");
    const reason = transitionBlockReason(sub.status, to, sub.plan);
    if (reason) return fail(reason);
    await db.subscription.update({
      where: { id },
      data: { status: to, closedAt: to === "CLOSED" ? new Date() : undefined },
    });
    revalidatePath("/portal", "layout");
    return ok(undefined, "Subscription updated");
  } catch (e) {
    return toFail(e);
  }
}

export const pauseSubscription = (id: string) => move(id, "PAUSED");
export const resumeSubscription = (id: string) => move(id, "ACTIVE");
export const closeSubscription = (id: string) => move(id, "CLOSED");

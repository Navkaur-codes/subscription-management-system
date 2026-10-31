"use server";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fail, ok, toFail, type ActionResult } from "@/lib/action";
import { changeStatus } from "@/lib/subscriptions/lifecycle";

/** Customer self-service: same rules and side effects as staff transitions, scoped to own subscriptions. */
async function move(id: string, to: SubscriptionStatus): Promise<ActionResult> {
  try {
    const s = await requireRole("CUSTOMER");
    if (!s.customerId) return fail("No customer profile linked to this account");
    const sub = await db.subscription.findFirst({ where: { id, customerId: s.customerId }, select: { id: true } });
    if (!sub) return fail("Subscription not found");
    await changeStatus(id, to);
    revalidatePath("/portal", "layout");
    return ok(undefined, "Subscription updated");
  } catch (e) {
    return toFail(e);
  }
}

export async function pauseSubscription(id: string) {
  return move(id, "PAUSED");
}

export async function resumeSubscription(id: string) {
  return move(id, "ACTIVE");
}

export async function closeSubscription(id: string) {
  return move(id, "CLOSED");
}

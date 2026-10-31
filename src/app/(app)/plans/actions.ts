"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, toFail } from "@/lib/action";
import { planSchema } from "@/lib/validators/catalog";
import { adminGuard } from "@/components/catalog/guard";

export async function savePlan(id: string | null, input: unknown) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const data = planSchema.parse(input);
    const saved = id ? await db.plan.update({ where: { id }, data }) : await db.plan.create({ data });
    revalidatePath("/plans");
    return ok({ id: saved.id }, id ? "Plan updated" : "Plan created");
  } catch (e) {
    return toFail(e);
  }
}

export async function togglePlan(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const p = await db.plan.findUnique({ where: { id } });
    if (!p) return fail("Plan not found");
    await db.plan.update({ where: { id }, data: { isActive: !p.isActive } });
    revalidatePath("/plans");
    return ok(undefined, p.isActive ? "Plan deactivated" : "Plan activated");
  } catch (e) {
    return toFail(e);
  }
}

export async function deletePlan(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const [subs, tpls] = await Promise.all([
      db.subscription.count({ where: { planId: id } }),
      db.quotationTemplate.count({ where: { planId: id } }),
    ]);
    if (subs + tpls > 0) return fail("Plan is used by subscriptions or templates, deactivate it instead");
    await db.plan.delete({ where: { id } });
    revalidatePath("/plans");
    return ok(undefined, "Plan deleted");
  } catch (e) {
    return toFail(e);
  }
}

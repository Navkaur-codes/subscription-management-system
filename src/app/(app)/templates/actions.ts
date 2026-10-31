"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, toFail } from "@/lib/action";
import { templateSchema } from "@/lib/validators/catalog";
import { adminGuard } from "@/components/catalog/guard";

export async function saveTemplate(id: string | null, input: unknown) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const { lines, ...data } = templateSchema.parse(input);
    const plan = await db.plan.findUnique({ where: { id: data.planId } });
    if (!plan) return fail("Plan not found", { planId: "Plan not found" });
    const low = lines.findIndex((l) => l.quantity < plan.minQuantity);
    if (low >= 0) {
      const msg = `Minimum quantity for this plan is ${plan.minQuantity}`;
      return fail(msg, { [`lines.${low}.quantity`]: msg });
    }
    const rows = lines.map((l) => ({ productId: l.productId, variantId: l.variantId || null, quantity: l.quantity }));
    const saved = await db.$transaction(async (tx) => {
      const t = id ? await tx.quotationTemplate.update({ where: { id }, data }) : await tx.quotationTemplate.create({ data });
      await tx.quotationTemplateLine.deleteMany({ where: { templateId: t.id } });
      await tx.quotationTemplateLine.createMany({ data: rows.map((r) => ({ ...r, templateId: t.id })) });
      return t;
    });
    revalidatePath("/templates");
    return ok({ id: saved.id }, id ? "Template updated" : "Template created");
  } catch (e) {
    return toFail(e);
  }
}

export async function deleteTemplate(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    await db.quotationTemplate.delete({ where: { id } });
    revalidatePath("/templates");
    return ok(undefined, "Template deleted");
  } catch (e) {
    return toFail(e);
  }
}

"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, toFail } from "@/lib/action";
import { discountSchema } from "@/lib/validators/catalog";
import { adminGuard } from "@/components/catalog/guard";

export async function saveDiscount(id: string | null, input: unknown) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const { productIds, ...data } = discountSchema.parse(input);
    if (data.code) {
      const clash = await db.discount.findFirst({ where: { code: data.code, NOT: id ? { id } : undefined } });
      if (clash) return fail("Code is already in use", { code: "Code is already in use" });
    }
    const ids = data.scope === "PRODUCT" ? productIds : [];
    const saved = await db.$transaction(async (tx) => {
      const d = id ? await tx.discount.update({ where: { id }, data }) : await tx.discount.create({ data });
      await tx.discountProduct.deleteMany({ where: { discountId: d.id } });
      if (ids.length) await tx.discountProduct.createMany({ data: ids.map((productId) => ({ discountId: d.id, productId })) });
      return d;
    });
    revalidatePath("/discounts");
    return ok({ id: saved.id }, id ? "Discount updated" : "Discount created");
  } catch (e) {
    return toFail(e);
  }
}

export async function toggleDiscount(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const d = await db.discount.findUnique({ where: { id } });
    if (!d) return fail("Discount not found");
    await db.discount.update({ where: { id }, data: { isActive: !d.isActive } });
    revalidatePath("/discounts");
    return ok(undefined, d.isActive ? "Discount deactivated" : "Discount activated");
  } catch (e) {
    return toFail(e);
  }
}

export async function deleteDiscount(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const used = await db.subscription.count({ where: { discountId: id } });
    const inv = await db.invoice.count({ where: { discountId: id } });
    if (used + inv > 0) return fail("Discount is used by subscriptions or invoices, deactivate it instead");
    await db.discount.delete({ where: { id } });
    revalidatePath("/discounts");
    return ok(undefined, "Discount deleted");
  } catch (e) {
    return toFail(e);
  }
}

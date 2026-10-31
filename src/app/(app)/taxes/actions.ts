"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, toFail } from "@/lib/action";
import { taxSchema } from "@/lib/validators/catalog";
import { adminGuard } from "@/components/catalog/guard";

export async function saveTax(id: string | null, input: unknown) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const data = taxSchema.parse(input);
    if (id) await db.tax.update({ where: { id }, data });
    else await db.tax.create({ data });
    revalidatePath("/taxes");
    return ok(undefined, id ? "Tax updated" : "Tax created");
  } catch (e) {
    return toFail(e);
  }
}

export async function toggleTax(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const t = await db.tax.findUnique({ where: { id } });
    if (!t) return fail("Tax not found");
    await db.tax.update({ where: { id }, data: { isActive: !t.isActive } });
    revalidatePath("/taxes");
    return ok(undefined, t.isActive ? "Tax deactivated" : "Tax activated");
  } catch (e) {
    return toFail(e);
  }
}

export async function deleteTax(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const used = await db.productTax.count({ where: { taxId: id } });
    if (used > 0) return fail("Tax is used by products, deactivate it instead");
    await db.tax.delete({ where: { id } });
    revalidatePath("/taxes");
    return ok(undefined, "Tax deleted");
  } catch (e) {
    return toFail(e);
  }
}

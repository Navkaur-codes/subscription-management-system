"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { fail, ok, toFail } from "@/lib/action";
import { productSchema } from "@/lib/validators/catalog";
import { adminGuard } from "@/components/catalog/guard";

export async function saveProduct(id: string | null, input: unknown) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const p = productSchema.parse(input);
    const { taxIds, variants, ...fields } = p;

    const saved = await db.$transaction(async (tx) => {
      const product = id
        ? await tx.product.update({ where: { id }, data: fields })
        : await tx.product.create({ data: fields });

      await tx.productTax.deleteMany({ where: { productId: product.id } });
      if (taxIds.length) await tx.productTax.createMany({ data: taxIds.map((taxId) => ({ productId: product.id, taxId })) });

      const existing = await tx.productVariant.findMany({ where: { productId: product.id } });
      const keepIds = new Set(variants.map((v) => v.id).filter((v): v is string => !!v));
      for (const old of existing.filter((e) => !keepIds.has(e.id))) {
        const [sub, inv, tpl] = await Promise.all([
          tx.subscriptionLine.count({ where: { variantId: old.id } }),
          tx.invoiceLine.count({ where: { variantId: old.id } }),
          tx.quotationTemplateLine.count({ where: { variantId: old.id } }),
        ]);
        if (sub + inv + tpl > 0) throw new Error(`Variant ${old.attribute}: ${old.value} is in use and cannot be removed`);
        await tx.productVariant.delete({ where: { id: old.id } });
      }
      // Two passes avoid unique clashes when values are swapped between rows.
      for (const v of variants.filter((x) => x.id)) {
        await tx.productVariant.update({ where: { id: v.id }, data: { attribute: `__tmp_${v.id}` } });
      }
      for (const v of variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { attribute: v.attribute, value: v.value, extraPrice: v.extraPrice },
          });
        } else {
          await tx.productVariant.create({
            data: { productId: product.id, attribute: v.attribute, value: v.value, extraPrice: v.extraPrice },
          });
        }
      }
      return product;
    });

    revalidatePath("/products");
    return ok({ id: saved.id }, id ? "Product updated" : "Product created");
  } catch (e) {
    return toFail(e);
  }
}

export async function toggleProduct(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const p = await db.product.findUnique({ where: { id } });
    if (!p) return fail("Product not found");
    await db.product.update({ where: { id }, data: { isActive: !p.isActive } });
    revalidatePath("/products");
    return ok(undefined, p.isActive ? "Product deactivated" : "Product activated");
  } catch (e) {
    return toFail(e);
  }
}

export async function deleteProduct(id: string) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    const [sub, inv, tpl] = await Promise.all([
      db.subscriptionLine.count({ where: { productId: id } }),
      db.invoiceLine.count({ where: { productId: id } }),
      db.quotationTemplateLine.count({ where: { productId: id } }),
    ]);
    if (sub + inv + tpl > 0) return fail("Product is used in subscriptions, invoices or templates, deactivate it instead");
    await db.product.delete({ where: { id } });
    revalidatePath("/products");
    return ok(undefined, "Product deleted");
  } catch (e) {
    return toFail(e);
  }
}

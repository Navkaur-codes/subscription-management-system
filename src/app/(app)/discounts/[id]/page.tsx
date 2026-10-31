import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toDateInput, toNum } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DiscountForm } from "@/components/catalog/discount-form";
import { ToggleDeleteActions } from "@/components/catalog/row-actions";
import { deleteDiscount, toggleDiscount } from "../actions";

export const metadata = { title: "Discount" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [d, products] = await Promise.all([
    db.discount.findUnique({ where: { id }, include: { products: true } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
  ]);
  if (!d) notFound();
  const selected = new Set(d.products.map((p) => p.productId));

  return (
    <>
      <PageHeader
        title={d.name}
        description="Edit discount"
        actions={
          <ToggleDeleteActions
            id={d.id}
            isActive={d.isActive}
            noun="discount"
            toggle={toggleDiscount}
            remove={deleteDiscount}
            redirectAfterDelete="/discounts"
          />
        }
      />
      <DiscountForm
        usedCount={d.usedCount}
        products={products.filter((p) => p.isActive || selected.has(p.id))}
        initial={{
          id: d.id,
          name: d.name,
          code: d.code ?? "",
          type: d.type,
          value: String(toNum(d.value)),
          scope: d.scope,
          productIds: [...selected],
          minPurchase: String(toNum(d.minPurchase)),
          minQuantity: String(d.minQuantity),
          startDate: toDateInput(d.startDate),
          endDate: toDateInput(d.endDate),
          usageLimit: d.usageLimit === null ? "" : String(d.usageLimit),
          isActive: d.isActive,
        }}
      />
    </>
  );
}

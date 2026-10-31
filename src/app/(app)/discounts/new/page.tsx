import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { DiscountForm, emptyDiscount } from "@/components/catalog/discount-form";

export const metadata = { title: "New discount" };

export default async function Page() {
  await requireRole("ADMIN");
  const products = await db.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="New discount" />
      <DiscountForm initial={emptyDiscount} products={products} />
    </>
  );
}

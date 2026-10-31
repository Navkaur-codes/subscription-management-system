import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toNum } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm, emptyProduct } from "@/components/catalog/product-form";

export const metadata = { title: "New product" };

export default async function Page() {
  await requireRole("ADMIN");
  const taxes = await db.tax.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="New product" />
      <ProductForm initial={emptyProduct} taxes={taxes.map((t) => ({ id: t.id, name: t.name, rate: toNum(t.rate) }))} readOnly={false} />
    </>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toNum } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/catalog/product-form";
import { ToggleDeleteActions } from "@/components/catalog/row-actions";
import { deleteProduct, toggleProduct } from "../actions";

export const metadata = { title: "Product" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const [product, taxes] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: { orderBy: { createdAt: "asc" } }, taxes: true } }),
    db.tax.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  const admin = user.role === "ADMIN";
  const selected = new Set(product.taxes.map((t) => t.taxId));
  const visibleTaxes = taxes.filter((t) => t.isActive || selected.has(t.id));

  return (
    <>
      <PageHeader
        title={product.name}
        description={admin ? "Edit product" : "Read-only view"}
        actions={
          admin && (
            <ToggleDeleteActions
              id={product.id}
              isActive={product.isActive}
              noun="product"
              toggle={toggleProduct}
              remove={deleteProduct}
              redirectAfterDelete="/products"
            />
          )
        }
      />
      <ProductForm
        readOnly={!admin}
        taxes={visibleTaxes.map((t) => ({ id: t.id, name: t.name, rate: toNum(t.rate) }))}
        initial={{
          id: product.id,
          name: product.name,
          type: product.type,
          salesPrice: String(toNum(product.salesPrice)),
          costPrice: String(toNum(product.costPrice)),
          notes: product.notes ?? "",
          isActive: product.isActive,
          taxIds: product.taxes.map((t) => t.taxId),
          variants: product.variants.map((x) => ({
            id: x.id,
            attribute: x.attribute,
            value: x.value,
            extraPrice: String(toNum(x.extraPrice)),
          })),
        }}
      />
    </>
  );
}

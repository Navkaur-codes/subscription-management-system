import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateForm, emptyTemplate } from "@/components/catalog/template-form";
import { loadTemplateOptions } from "@/components/catalog/template-data";

export const metadata = { title: "New template" };

export default async function Page() {
  await requireRole("ADMIN");
  const { plans, products } = await loadTemplateOptions();
  return (
    <>
      <PageHeader title="New quotation template" />
      <TemplateForm initial={emptyTemplate} plans={plans} products={products} readOnly={false} />
    </>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateForm } from "@/components/catalog/template-form";
import { TemplateDeleteButton } from "@/components/catalog/template-delete";
import { loadTemplateOptions } from "@/components/catalog/template-data";

export const metadata = { title: "Quotation template" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const t = await db.quotationTemplate.findUnique({ where: { id }, include: { lines: { orderBy: { id: "asc" } } } });
  if (!t) notFound();
  const admin = user.role === "ADMIN";
  const { plans, products } = await loadTemplateOptions(
    t.planId,
    t.lines.map((l) => l.productId)
  );

  return (
    <>
      <PageHeader
        title={t.name}
        description={admin ? "Edit template" : "Read-only view"}
        actions={
          <>
            {admin && <TemplateDeleteButton id={t.id} />}
            <Button asChild size="lg">
              <Link href={`/subscriptions/new?templateId=${t.id}`}>
                Use template
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />
      <TemplateForm
        readOnly={!admin}
        plans={plans}
        products={products}
        initial={{
          id: t.id,
          name: t.name,
          planId: t.planId,
          validityDays: String(t.validityDays),
          paymentTerms: String(t.paymentTerms),
          notes: t.notes ?? "",
          lines: t.lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? "", quantity: String(l.quantity) })),
        }}
      />
    </>
  );
}

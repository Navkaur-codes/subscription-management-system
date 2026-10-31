import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toDateInput, toNum } from "@/lib/format";
import { loadFormOptions } from "@/lib/subscriptions/form-options";
import { PageHeader } from "@/components/shared/page-header";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import type { SubscriptionFormValues } from "@/components/subscriptions/form-types";

export const metadata = { title: "Edit subscription" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const sub = await db.subscription.findUnique({ where: { id }, include: { lines: true } });
  if (!sub) notFound();
  if (sub.status !== "DRAFT" && sub.status !== "QUOTATION") redirect(`/subscriptions/${id}`);

  const options = await loadFormOptions(sub.planId);
  const initial: SubscriptionFormValues = {
    customerId: sub.customerId,
    planId: sub.planId,
    startDate: toDateInput(sub.startDate),
    expiryDate: toDateInput(sub.expiryDate),
    quotationExpiry: toDateInput(sub.quotationExpiry),
    paymentTerms: sub.paymentTerms,
    discountId: sub.discountId ?? "",
    notes: sub.notes ?? "",
    lines: sub.lines.map((l) => ({
      key: l.id,
      productId: l.productId,
      variantId: l.variantId ?? "",
      quantity: l.quantity,
      unitPrice: toNum(l.unitPrice),
      taxRate: toNum(l.taxRate),
    })),
  };

  return (
    <>
      <PageHeader title={`Edit ${sub.number}`} description="Only draft and quotation subscriptions can be edited." />
      <SubscriptionForm id={sub.id} options={options} initial={initial} />
    </>
  );
}

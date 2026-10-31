import { addDays } from "date-fns";
import { Repeat } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { today } from "@/lib/dates";
import { toDateInput, toNum } from "@/lib/format";
import { unitPrice, sumTaxRates } from "@/lib/pricing";
import { loadFormOptions } from "@/lib/subscriptions/form-options";
import { termEnd } from "@/lib/subscriptions/pricing";
import { PageHeader } from "@/components/shared/page-header";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import type { SubscriptionFormValues } from "@/components/subscriptions/form-types";

export const metadata = { title: "New subscription" };

export default async function Page({ searchParams }: { searchParams: Promise<{ templateId?: string }> }) {
  await requireRole("ADMIN", "STAFF");
  const { templateId } = await searchParams;
  const start = today();

  const template = templateId
    ? await db.quotationTemplate.findUnique({
        where: { id: templateId },
        include: {
          plan: { select: { billingPeriod: true } },
          lines: {
            include: {
              product: { include: { taxes: { include: { tax: true } } } },
              variant: true,
            },
          },
        },
      })
    : null;
  const options = await loadFormOptions(template?.planId);

  const initial: SubscriptionFormValues = {
    customerId: "",
    planId: template?.planId ?? "",
    startDate: toDateInput(start),
    expiryDate: template ? toDateInput(termEnd(start, template.plan.billingPeriod)) : toDateInput(addDays(start, 365)),
    quotationExpiry: template ? toDateInput(addDays(start, template.validityDays)) : "",
    paymentTerms: template?.paymentTerms ?? 15,
    discountId: "",
    notes: template?.notes ?? "",
    lines:
      template?.lines.map((l) => ({
        key: l.id,
        productId: l.productId,
        variantId: l.variantId ?? "",
        quantity: l.quantity,
        unitPrice: unitPrice(toNum(l.product.salesPrice), toNum(l.variant?.extraPrice)),
        taxRate: sumTaxRates(l.product.taxes.map((t) => ({ rate: toNum(t.tax.rate), isActive: t.tax.isActive }))),
      })) ?? [],
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales · Subscriptions"
        icon={Repeat}
        title="New subscription"
        description={template ? `Prefilled from template “${template.name}”.` : "Create a quotation or subscription for a customer."}
      />
      <SubscriptionForm id={null} options={options} initial={initial} />
    </>
  );
}

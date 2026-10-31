"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormGrid } from "@/components/shared/form-field";
import { Section } from "@/components/shared/page-header";
import { priceLines } from "@/lib/pricing";
import { formatMoney, toDateInput } from "@/lib/format";
import { termEnd } from "@/lib/subscriptions/pricing";
import type { FormOptions } from "@/lib/subscriptions/form-options";
import { saveSubscription } from "@/app/(app)/subscriptions/actions";
import { CustomerPicker } from "./customer-picker";
import { LinesEditor, newLine } from "./lines-editor";
import { FormSummary } from "./form-summary";
import type { SubscriptionFormValues } from "./form-types";

const NONE = "none";

export function SubscriptionForm({
  id,
  options,
  initial,
}: {
  id: string | null;
  options: FormOptions;
  initial: SubscriptionFormValues;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<SubscriptionFormValues>(() => ({
    ...initial,
    lines: initial.lines.length ? initial.lines : [newLine()],
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<SubscriptionFormValues>) => setV((cur) => ({ ...cur, ...patch }));

  const plan = options.plans.find((p) => p.id === v.planId);
  const discount = options.discounts.find((d) => d.id === v.discountId) ?? null;
  const validLines = v.lines.filter((l) => l.productId);
  const totals = priceLines(validLines, discount);
  const totalQty = validLines.reduce((s, l) => s + l.quantity, 0);
  const minQtyError = plan && totalQty < plan.minQuantity ? `Plan needs a total quantity of at least ${plan.minQuantity}` : "";

  const recomputeExpiry = (planId: string, startDate: string) => {
    const p = options.plans.find((x) => x.id === planId);
    return p && startDate ? toDateInput(termEnd(new Date(startDate), p.billingPeriod)) : v.expiryDate;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minQtyError) return toast.error(minQtyError);
    start(async () => {
      const res = await saveSubscription(id, {
        ...v,
        quotationExpiry: v.quotationExpiry || null,
        discountId: v.discountId || null,
        lines: validLines.map((l) => ({ ...l, variantId: l.variantId || null })),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Saved");
      router.push(`/subscriptions/${res.data}`);
    });
  };

  const customer = options.customers.find((c) => c.id === v.customerId);
  const checks = [
    { ok: !!customer, label: customer ? "Customer selected" : "Select a customer" },
    { ok: !!plan, label: plan ? "Plan selected" : "Select a plan" },
    { ok: validLines.length > 0, label: validLines.length ? `${validLines.length} line(s), ${totalQty} units` : "Add at least one line" },
    ...(plan ? [{ ok: !minQtyError, label: minQtyError || `Meets plan minimum (${plan.minQuantity})` }] : []),
    ...(discount ? [{ ok: totals.discountApplied, label: totals.discountApplied ? `${discount.name} applied` : `Discount not applied: ${totals.discountReason}` }] : []),
  ];

  return (
    <form onSubmit={submit} className="pb-4">
      <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-6 lg:col-span-2">
      <Section title="Customer & plan" description="Who is subscribing and which plan sets the billing period and rules.">
        <FormGrid>
          <FormField label="Customer" required error={errors.customerId}>
            <CustomerPicker customers={options.customers} value={v.customerId} onChange={(customerId) => set({ customerId })} />
            <Link href="/customers/new" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              + Add customer
            </Link>
          </FormField>
          <FormField label="Plan" required error={errors.planId} hint={plan ? `Min. quantity ${plan.minQuantity}` : undefined}>
            <Select value={v.planId} onValueChange={(planId) => set({ planId, expiryDate: recomputeExpiry(planId, v.startDate) })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select plan">{plan && `${plan.name} · ${plan.billingPeriod.toLowerCase()}`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.billingPeriod.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormGrid>
      </Section>

      <Section title="Schedule & terms" description="Expiry defaults to one term (12 periods, or 1 year for yearly plans).">
        <FormGrid>
          <FormField label="Start date" required error={errors.startDate}>
            <Input
              type="date"
              value={v.startDate}
              onChange={(e) => set({ startDate: e.target.value, expiryDate: recomputeExpiry(v.planId, e.target.value) })}
            />
          </FormField>
          <FormField label="Expiry date" required error={errors.expiryDate}>
            <Input type="date" value={v.expiryDate} onChange={(e) => set({ expiryDate: e.target.value })} />
          </FormField>
          <FormField label="Payment terms (days)" error={errors.paymentTerms}>
            <Input type="number" min={0} value={v.paymentTerms} onChange={(e) => set({ paymentTerms: Number(e.target.value) })} />
          </FormField>
          <FormField label="Quotation valid until" error={errors.quotationExpiry}>
            <Input type="date" value={v.quotationExpiry} onChange={(e) => set({ quotationExpiry: e.target.value })} />
          </FormField>
          <FormField
            label="Discount"
            hint={discount && !totals.discountApplied ? `Not applied: ${totals.discountReason}` : undefined}
          >
            <Select value={v.discountId || NONE} onValueChange={(d) => set({ discountId: d === NONE ? "" : d })}>
              <SelectTrigger className="w-full">
                <SelectValue>{discount ? discount.name : "No discount"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No discount</SelectItem>
                {options.discounts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.type === "PERCENT" ? `${d.value}%` : `₹${d.value}`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea rows={2} value={v.notes} onChange={(e) => set({ notes: e.target.value })} />
          </FormField>
        </FormGrid>
      </Section>

      <Section title="Order lines" description="Prices and tax come from the catalog; unit price can be overridden.">
        <LinesEditor products={options.products} lines={v.lines} priced={pricedFor(v.lines, totals.lines)} onChange={(lines) => set({ lines })} />
        {errors.lines && <p className="mt-2 text-xs text-destructive">{errors.lines}</p>}
      </Section>
      </div>

      <FormSummary
        customer={customer?.name}
        plan={plan ? `${plan.name} · billed ${plan.billingPeriod.toLowerCase()}` : undefined}
        totals={totals}
        checks={checks}
      />
      </div>

      <div className="sticky bottom-0 z-20 mt-6 flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-card">
        <p className="hidden truncate pl-2 text-sm text-muted-foreground sm:block">
          Total per period <span className="font-mono-num font-semibold text-foreground">{formatMoney(totals.total)}</span>
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {id ? "Save changes" : "Create subscription"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Map priced results (only for lines with a product) back onto every editor row. */
function pricedFor(lines: SubscriptionFormValues["lines"], priced: ReturnType<typeof priceLines>["lines"]) {
  let i = 0;
  return lines.map((l) => (l.productId ? priced[i++] : { ...l, base: 0, discountAmount: 0, taxAmount: 0, amount: 0 }));
}

"use client";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormGrid } from "@/components/shared/form-field";
import { Section } from "@/components/shared/page-header";
import { saveTemplate } from "@/app/(app)/templates/actions";
import { priceLines, unitPrice } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { NativeSelect } from "./native-select";
import { useFormAction } from "./use-form-action";

export type TemplateProduct = {
  id: string;
  name: string;
  salesPrice: number;
  taxRate: number;
  variants: { id: string; label: string; extraPrice: number }[];
};
export type TemplatePlan = { id: string; name: string; minQuantity: number };
type Line = { productId: string; variantId: string; quantity: string };
export type TemplateFormValues = {
  id?: string;
  name: string;
  planId: string;
  validityDays: string;
  paymentTerms: string;
  notes: string;
  lines: Line[];
};

export const emptyTemplate: TemplateFormValues = {
  name: "",
  planId: "",
  validityDays: "30",
  paymentTerms: "15",
  notes: "",
  lines: [{ productId: "", variantId: "", quantity: "1" }],
};

export function TemplateForm({
  initial,
  plans,
  products,
  readOnly,
}: {
  initial: TemplateFormValues;
  plans: TemplatePlan[];
  products: TemplateProduct[];
  readOnly: boolean;
}) {
  const [v, setV] = useState(initial);
  const { pending, errors, submit } = useFormAction((d: TemplateFormValues) => saveTemplate(initial.id ?? null, d), "/templates");
  const set = <K extends keyof TemplateFormValues>(k: K, val: TemplateFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const setLine = (i: number, patch: Partial<Line>) => set("lines", v.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const plan = plans.find((p) => p.id === v.planId);

  const priced = priceLines(
    v.lines.flatMap((l) => {
      const p = byId.get(l.productId);
      if (!p) return [];
      const extra = p.variants.find((x) => x.id === l.variantId)?.extraPrice ?? 0;
      return [{ productId: p.id, quantity: Number(l.quantity) || 0, unitPrice: unitPrice(p.salesPrice, extra), taxRate: p.taxRate }];
    })
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly) submit(v);
      }}
    >
      <fieldset disabled={readOnly} className="space-y-6">
        <Section title="Template">
          <FormGrid>
            <FormField label="Name" htmlFor="t-name" required error={errors.name}>
              <Input id="t-name" value={v.name} onChange={(e) => set("name", e.target.value)} />
            </FormField>
            <FormField label="Plan" htmlFor="t-plan" required error={errors.planId}>
              <NativeSelect id="t-plan" value={v.planId} onChange={(e) => set("planId", e.target.value)}>
                <option value="">Select a plan…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Validity (days)" htmlFor="t-valid" error={errors.validityDays}>
              <Input id="t-valid" type="number" min={1} value={v.validityDays} onChange={(e) => set("validityDays", e.target.value)} />
            </FormField>
            <FormField label="Payment terms (days)" htmlFor="t-terms" error={errors.paymentTerms}>
              <Input id="t-terms" type="number" min={0} value={v.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
            </FormField>
          </FormGrid>
          <div className="mt-4">
            <FormField label="Notes" htmlFor="t-notes" error={errors.notes}>
              <Textarea id="t-notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section
          title="Lines"
          description={plan ? `Minimum quantity for ${plan.name}: ${plan.minQuantity}` : undefined}
          actions={
            !readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={() => set("lines", [...v.lines, { productId: "", variantId: "", quantity: String(plan?.minQuantity ?? 1) }])}>
                <Plus className="size-4" />
                Add line
              </Button>
            )
          }
        >
          {errors.lines && <p className="mb-3 text-xs text-destructive">{errors.lines}</p>}
          <div className="space-y-3">
            {v.lines.map((l, i) => {
              const p = byId.get(l.productId);
              return (
                <div key={i} className="grid items-start gap-2 sm:grid-cols-[2fr_2fr_7rem_auto]">
                  <FormField label="Product" error={errors[`lines.${i}.productId`]}>
                    <NativeSelect value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value, variantId: "" })}>
                      <option value="">Select a product…</option>
                      {products.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Variant">
                    <NativeSelect value={l.variantId} disabled={!p || p.variants.length === 0} onChange={(e) => setLine(i, { variantId: e.target.value })}>
                      <option value="">No variant</option>
                      {p?.variants.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label} (+{formatMoney(x.extraPrice)})
                        </option>
                      ))}
                    </NativeSelect>
                  </FormField>
                  <FormField label="Quantity" error={errors[`lines.${i}.quantity`]}>
                    <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                  </FormField>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-5"
                      aria-label="Remove line"
                      disabled={v.lines.length === 1}
                      onClick={() => set("lines", v.lines.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <dl className="num mt-5 ml-auto grid max-w-xs grid-cols-2 gap-y-1 border-t pt-4 text-sm">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-right">{formatMoney(priced.subtotal)}</dd>
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="text-right">{formatMoney(priced.taxTotal)}</dd>
            <dt className="font-medium">Total per period</dt>
            <dd className="text-right font-semibold">{formatMoney(priced.total)}</dd>
          </dl>
        </Section>
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {initial.id ? "Save changes" : "Create template"}
          </Button>
        </div>
      )}
    </form>
  );
}

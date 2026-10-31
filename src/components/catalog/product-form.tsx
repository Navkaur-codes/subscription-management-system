"use client";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormGrid } from "@/components/shared/form-field";
import { Section } from "@/components/shared/page-header";
import { saveProduct } from "@/app/(app)/products/actions";
import { unitPrice } from "@/lib/pricing";
import { formatMoney } from "@/lib/format";
import { NativeSelect } from "./native-select";
import { useFormAction } from "./use-form-action";

export type ProductFormValues = {
  id?: string;
  name: string;
  type: "SERVICE" | "GOODS";
  salesPrice: string;
  costPrice: string;
  notes: string;
  isActive: boolean;
  taxIds: string[];
  variants: { id?: string; attribute: string; value: string; extraPrice: string }[];
};

export const emptyProduct: ProductFormValues = {
  name: "",
  type: "SERVICE",
  salesPrice: "",
  costPrice: "0",
  notes: "",
  isActive: true,
  taxIds: [],
  variants: [],
};

export function ProductForm({
  initial,
  taxes,
  readOnly,
}: {
  initial: ProductFormValues;
  taxes: { id: string; name: string; rate: number }[];
  readOnly: boolean;
}) {
  const [v, setV] = useState(initial);
  const { pending, errors, submit } = useFormAction((d: ProductFormValues) => saveProduct(initial.id ?? null, d), "/products");
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const setVariant = (i: number, patch: Partial<ProductFormValues["variants"][number]>) =>
    set("variants", v.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const base = Number(v.salesPrice) || 0;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly) submit(v);
      }}
    >
      <fieldset disabled={readOnly} className="space-y-6">
        <Section title="Details">
          <FormGrid>
            <FormField label="Name" htmlFor="p-name" required error={errors.name}>
              <Input id="p-name" value={v.name} onChange={(e) => set("name", e.target.value)} />
            </FormField>
            <FormField label="Type" htmlFor="p-type" error={errors.type}>
              <NativeSelect id="p-type" value={v.type} onChange={(e) => set("type", e.target.value as "SERVICE" | "GOODS")}>
                <option value="SERVICE">Service</option>
                <option value="GOODS">Goods</option>
              </NativeSelect>
            </FormField>
            <FormField label="Sales price (₹)" htmlFor="p-sales" required error={errors.salesPrice}>
              <Input id="p-sales" type="number" step="0.01" value={v.salesPrice} onChange={(e) => set("salesPrice", e.target.value)} />
            </FormField>
            <FormField label="Cost price (₹)" htmlFor="p-cost" error={errors.costPrice}>
              <Input id="p-cost" type="number" step="0.01" value={v.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
            </FormField>
          </FormGrid>
          <div className="mt-4 grid gap-4">
            <FormField label="Notes" htmlFor="p-notes" error={errors.notes}>
              <Textarea id="p-notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
            </FormField>
            <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
              Active
              <Switch checked={v.isActive} onCheckedChange={(c) => set("isActive", c)} />
            </label>
          </div>
        </Section>

        <Section title="Taxes" description="Rates are summed when the product is priced.">
          {taxes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active taxes. Create one under Taxes.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {taxes.map((t) => (
                <label key={t.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <Checkbox
                    checked={v.taxIds.includes(t.id)}
                    onCheckedChange={(c) => set("taxIds", c ? [...v.taxIds, t.id] : v.taxIds.filter((x) => x !== t.id))}
                  />
                  {t.name}
                  <span className="num ml-auto text-muted-foreground">{t.rate}%</span>
                </label>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Variants"
          description="Each variant adds an extra price on top of the sales price."
          actions={
            !readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={() => set("variants", [...v.variants, { attribute: "", value: "", extraPrice: "0" }])}>
                <Plus className="size-4" />
                Add variant
              </Button>
            )
          }
        >
          {v.variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants. Example: Brand = Odoo, extra price 560.</p>
          ) : (
            <div className="space-y-3">
              {v.variants.map((row, i) => (
                <div key={row.id ?? i} className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_8rem_9rem_auto]">
                  <FormField label="Attribute" error={errors[`variants.${i}.attribute`]}>
                    <Input value={row.attribute} placeholder="Brand" onChange={(e) => setVariant(i, { attribute: e.target.value })} />
                  </FormField>
                  <FormField label="Value" error={errors[`variants.${i}.value`]}>
                    <Input value={row.value} placeholder="Odoo" onChange={(e) => setVariant(i, { value: e.target.value })} />
                  </FormField>
                  <FormField label="Extra price (₹)" error={errors[`variants.${i}.extraPrice`]}>
                    <Input type="number" step="0.01" value={row.extraPrice} onChange={(e) => setVariant(i, { extraPrice: e.target.value })} />
                  </FormField>
                  <FormField label="Final price">
                    <div className="num flex h-9 items-center text-sm font-medium">{formatMoney(unitPrice(base, Number(row.extraPrice) || 0))}</div>
                  </FormField>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-5"
                      aria-label="Remove variant"
                      onClick={() => set("variants", v.variants.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </fieldset>

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {initial.id ? "Save changes" : "Create product"}
          </Button>
        </div>
      )}
    </form>
  );
}

"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormGrid } from "@/components/shared/form-field";
import { Section } from "@/components/shared/page-header";
import { saveDiscount } from "@/app/(app)/discounts/actions";
import { NativeSelect } from "./native-select";
import { useFormAction } from "./use-form-action";

export type DiscountFormValues = {
  id?: string;
  name: string;
  code: string;
  type: "FIXED" | "PERCENT";
  value: string;
  scope: "SUBSCRIPTION" | "PRODUCT";
  productIds: string[];
  minPurchase: string;
  minQuantity: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  isActive: boolean;
};

export const emptyDiscount: DiscountFormValues = {
  name: "",
  code: "",
  type: "PERCENT",
  value: "",
  scope: "SUBSCRIPTION",
  productIds: [],
  minPurchase: "0",
  minQuantity: "0",
  startDate: "",
  endDate: "",
  usageLimit: "",
  isActive: true,
};

export function DiscountForm({
  initial,
  products,
  usedCount,
}: {
  initial: DiscountFormValues;
  products: { id: string; name: string }[];
  usedCount?: number;
}) {
  const [v, setV] = useState(initial);
  const { pending, errors, submit } = useFormAction((d: DiscountFormValues) => saveDiscount(initial.id ?? null, d), "/discounts");
  const set = <K extends keyof DiscountFormValues>(k: K, val: DiscountFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit(v);
      }}
    >
      <Section title="Discount">
        <FormGrid>
          <FormField label="Name" htmlFor="d-name" required error={errors.name}>
            <Input id="d-name" value={v.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <FormField label="Code" htmlFor="d-code" hint="Optional, stored in uppercase" error={errors.code}>
            <Input id="d-code" value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Type" htmlFor="d-type" error={errors.type}>
            <NativeSelect id="d-type" value={v.type} onChange={(e) => set("type", e.target.value as "FIXED" | "PERCENT")}>
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed amount</option>
            </NativeSelect>
          </FormField>
          <FormField label={v.type === "PERCENT" ? "Value (%)" : "Value (₹)"} htmlFor="d-value" required error={errors.value}>
            <Input id="d-value" type="number" step="0.01" value={v.value} onChange={(e) => set("value", e.target.value)} />
          </FormField>
          <FormField label="Applies to" htmlFor="d-scope" error={errors.scope}>
            <NativeSelect id="d-scope" value={v.scope} onChange={(e) => set("scope", e.target.value as "SUBSCRIPTION" | "PRODUCT")}>
              <option value="SUBSCRIPTION">Whole subscription</option>
              <option value="PRODUCT">Selected products</option>
            </NativeSelect>
          </FormField>
          <FormField label="Usage limit" htmlFor="d-limit" hint="Blank = unlimited" error={errors.usageLimit}>
            <Input id="d-limit" type="number" min={0} value={v.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
          </FormField>
          <FormField label="Minimum purchase (₹)" htmlFor="d-minp" error={errors.minPurchase}>
            <Input id="d-minp" type="number" step="0.01" value={v.minPurchase} onChange={(e) => set("minPurchase", e.target.value)} />
          </FormField>
          <FormField label="Minimum quantity" htmlFor="d-minq" error={errors.minQuantity}>
            <Input id="d-minq" type="number" min={0} value={v.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} />
          </FormField>
          <FormField label="Valid from" htmlFor="d-start" error={errors.startDate}>
            <Input id="d-start" type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </FormField>
          <FormField label="Valid until" htmlFor="d-end" error={errors.endDate}>
            <Input id="d-end" type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </FormField>
        </FormGrid>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            Active
            <Switch checked={v.isActive} onCheckedChange={(c) => set("isActive", c)} />
          </label>
          {usedCount !== undefined && (
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              Times used
              <span className="num font-medium">{usedCount}</span>
            </div>
          )}
        </div>
      </Section>

      {v.scope === "PRODUCT" && (
        <Section title="Eligible products" description="The discount applies only to these products.">
          {errors.productIds && <p className="mb-3 text-xs text-destructive">{errors.productIds}</p>}
          <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={v.productIds.includes(p.id)}
                  onCheckedChange={(c) => set("productIds", c ? [...v.productIds, p.id] : v.productIds.filter((x) => x !== p.id))}
                />
                {p.name}
              </label>
            ))}
          </div>
        </Section>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {initial.id ? "Save changes" : "Create discount"}
        </Button>
      </div>
    </form>
  );
}

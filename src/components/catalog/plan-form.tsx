"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormField, FormGrid } from "@/components/shared/form-field";
import { Section } from "@/components/shared/page-header";
import { savePlan } from "@/app/(app)/plans/actions";
import { NativeSelect } from "./native-select";
import { useFormAction } from "./use-form-action";

export type PlanFormValues = {
  id?: string;
  name: string;
  price: string;
  billingPeriod: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  minQuantity: string;
  startDate: string;
  endDate: string;
  autoClose: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  isActive: boolean;
  notes: string;
};

export const emptyPlan: PlanFormValues = {
  name: "",
  price: "",
  billingPeriod: "MONTHLY",
  minQuantity: "1",
  startDate: "",
  endDate: "",
  autoClose: false,
  closable: true,
  pausable: true,
  renewable: true,
  isActive: true,
  notes: "",
};

const FLAGS: { key: "autoClose" | "closable" | "pausable" | "renewable" | "isActive"; label: string; hint: string }[] = [
  { key: "autoClose", label: "Auto close", hint: "Subscriptions close automatically at their expiry date." },
  { key: "closable", label: "Closable", hint: "Subscriptions can be closed before expiry." },
  { key: "pausable", label: "Pausable", hint: "Active subscriptions can be paused and resumed." },
  { key: "renewable", label: "Renewable", hint: "Subscriptions can be renewed after they end." },
  { key: "isActive", label: "Active", hint: "Available when creating new subscriptions." },
];

export function PlanForm({ initial, readOnly }: { initial: PlanFormValues; readOnly: boolean }) {
  const [v, setV] = useState(initial);
  const { pending, errors, submit } = useFormAction((d: PlanFormValues) => savePlan(initial.id ?? null, d), "/plans");
  const set = <K extends keyof PlanFormValues>(k: K, val: PlanFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!readOnly) submit(v);
      }}
    >
      <fieldset disabled={readOnly} className="space-y-6">
        <Section title="Pricing">
          <FormGrid>
            <FormField label="Name" htmlFor="pl-name" required error={errors.name}>
              <Input id="pl-name" value={v.name} onChange={(e) => set("name", e.target.value)} />
            </FormField>
            <FormField label="Price (₹)" htmlFor="pl-price" required error={errors.price}>
              <Input id="pl-price" type="number" step="0.01" value={v.price} onChange={(e) => set("price", e.target.value)} />
            </FormField>
            <FormField label="Billing period" htmlFor="pl-period" error={errors.billingPeriod}>
              <NativeSelect id="pl-period" value={v.billingPeriod} onChange={(e) => set("billingPeriod", e.target.value as PlanFormValues["billingPeriod"])}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </NativeSelect>
            </FormField>
            <FormField label="Minimum quantity" htmlFor="pl-qty" error={errors.minQuantity}>
              <Input id="pl-qty" type="number" min={1} value={v.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} />
            </FormField>
            <FormField label="Available from" htmlFor="pl-start" error={errors.startDate}>
              <Input id="pl-start" type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </FormField>
            <FormField label="Available until" htmlFor="pl-end" error={errors.endDate}>
              <Input id="pl-end" type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </FormField>
          </FormGrid>
          <div className="mt-4">
            <FormField label="Notes" htmlFor="pl-notes" error={errors.notes}>
              <Textarea id="pl-notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section title="Rules">
          <div className="grid gap-3 sm:grid-cols-2">
            {FLAGS.map((f) => (
              <label key={f.key} className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm">
                <span>
                  <span className="font-medium">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </span>
                <Switch checked={v[f.key]} onCheckedChange={(c) => set(f.key, c)} />
              </label>
            ))}
          </div>
        </Section>
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {initial.id ? "Save changes" : "Create plan"}
          </Button>
        </div>
      )}
    </form>
  );
}

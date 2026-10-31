"use client";
import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FormField } from "@/components/shared/form-field";
import { saveTax } from "@/app/(app)/taxes/actions";
import { useFormAction } from "./use-form-action";

type Tax = { id: string; name: string; rate: number; isActive: boolean };
type Draft = { name: string; rate: string; isActive: boolean };

export function TaxSheet({ tax, children }: { tax?: Tax; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tax?.name ?? "");
  const [rate, setRate] = useState(tax ? String(tax.rate) : "");
  const [isActive, setActive] = useState(tax?.isActive ?? true);
  const { pending, errors, submit } = useFormAction((d: Draft) => saveTax(tax?.id ?? null, d));
  const reset = () => {
    if (!tax) {
      setName("");
      setRate("");
      setActive(true);
    }
    setOpen(false);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{tax ? "Edit tax" : "New tax"}</SheetTitle>
          <SheetDescription>Rates are percentages applied after discounts.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          <FormField label="Name" htmlFor="tax-name" required error={errors.name}>
            <Input id="tax-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="GST 18%" />
          </FormField>
          <FormField label="Rate (%)" htmlFor="tax-rate" required error={errors.rate}>
            <Input id="tax-rate" type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          </FormField>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            Active
            <Switch checked={isActive} onCheckedChange={setActive} />
          </label>
        </div>
        <SheetFooter>
          <Button disabled={pending} onClick={() => submit({ name, rate, isActive }, reset)}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

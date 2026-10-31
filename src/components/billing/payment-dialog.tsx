"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FormField } from "@/components/shared/form-field";
import { formatMoney } from "@/lib/format";
import type { ActionResult } from "@/lib/action";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentInput } from "@/lib/validators/billing";

type Props = {
  invoiceId: string;
  outstanding: number;
  today: string;
  action: (input: PaymentInput) => Promise<ActionResult<{ settled: boolean }>>;
};

export function PaymentDialog({ invoiceId, outstanding, today, action }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ method: "BANK_TRANSFER", amount: String(outstanding), paymentDate: today, reference: "", note: "" });
  const upd = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (amount > outstanding) return setErrors({ amount: `Cannot exceed ${formatMoney(outstanding)}` });
    start(async () => {
      const res = await action({
        invoiceId,
        ...form,
        amount,
        paymentDate: new Date(`${form.paymentDate}T00:00:00`),
        method: form.method as PaymentInput["method"],
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(res.message ?? "Payment recorded");
      setOpen(false);
      setErrors({});
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Wallet className="size-4" />
          Register payment
        </Button>
      </SheetTrigger>
      <SheetContent>
        <form onSubmit={submit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Register payment</SheetTitle>
            <SheetDescription>Outstanding balance: {formatMoney(outstanding)}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <FormField label="Amount" htmlFor="amount" error={errors.amount} required>
              <Input id="amount" type="number" step="0.01" min="0.01" max={outstanding} value={form.amount} onChange={(e) => upd("amount")(e.target.value)} />
            </FormField>
            <FormField label="Method" error={errors.method} required>
              <Select value={form.method} onValueChange={upd("method")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Payment date" htmlFor="paymentDate" error={errors.paymentDate} required>
              <Input id="paymentDate" type="date" value={form.paymentDate} onChange={(e) => upd("paymentDate")(e.target.value)} />
            </FormField>
            <FormField label="Reference" htmlFor="reference" hint="UTR, cheque no., card ref…" error={errors.reference}>
              <Input id="reference" value={form.reference} onChange={(e) => upd("reference")(e.target.value)} />
            </FormField>
            <FormField label="Note" htmlFor="note" error={errors.note}>
              <Textarea id="note" rows={3} value={form.note} onChange={(e) => upd("note")(e.target.value)} />
            </FormField>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Record payment
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

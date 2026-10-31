"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormGrid } from "@/components/shared/form-field";
import { Section } from "@/components/shared/page-header";
import type { ActionResult } from "@/lib/action";
import type { CustomerInput } from "@/lib/validators/customer";

type Props = {
  initial?: CustomerInput;
  submit: (input: CustomerInput) => Promise<ActionResult<{ id: string }>>;
  redirectTo?: (id?: string) => string;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export function CustomerForm({ initial, submit, redirectTo }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (fd: FormData) => {
    const input: CustomerInput = {
      name: text(fd, "name"),
      email: text(fd, "email"),
      phone: text(fd, "phone"),
      company: text(fd, "company"),
      city: text(fd, "city"),
      gstin: text(fd, "gstin"),
      address: text(fd, "address"),
    };
    start(async () => {
      const res = await submit(input);
      if (res.ok) {
        setErrors({});
        toast.success(res.message ?? "Saved");
        if (redirectTo) router.push(redirectTo(res.data?.id));
        else router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  };

  return (
    <form action={onSubmit}>
      <Section title="Customer details">
        <FormGrid>
          <FormField label="Name" htmlFor="name" required error={errors.name}>
            <Input id="name" name="name" defaultValue={initial?.name} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={initial?.email} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors.phone}>
            <Input id="phone" name="phone" defaultValue={initial?.phone} />
          </FormField>
          <FormField label="Company" htmlFor="company" error={errors.company}>
            <Input id="company" name="company" defaultValue={initial?.company} />
          </FormField>
          <FormField label="City" htmlFor="city" error={errors.city}>
            <Input id="city" name="city" defaultValue={initial?.city} />
          </FormField>
          <FormField label="GSTIN" htmlFor="gstin" error={errors.gstin}>
            <Input id="gstin" name="gstin" defaultValue={initial?.gstin} />
          </FormField>
          <FormField label="Address" htmlFor="address" className="sm:col-span-2" error={errors.address}>
            <Textarea id="address" name="address" rows={3} defaultValue={initial?.address} />
          </FormField>
        </FormGrid>
        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save customer
          </Button>
        </div>
      </Section>
    </form>
  );
}

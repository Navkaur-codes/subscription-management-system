"use client";
import { createCustomer, updateCustomer } from "@/app/(app)/customers/actions";
import type { CustomerInput } from "@/lib/validators/customer";
import { CustomerForm } from "./customer-form";

export function NewCustomerForm() {
  return <CustomerForm submit={createCustomer} redirectTo={(id) => `/customers/${id}`} />;
}

export function EditCustomerForm({ id, initial }: { id: string; initial: CustomerInput }) {
  return <CustomerForm initial={initial} submit={(input) => updateCustomer(id, input)} />;
}

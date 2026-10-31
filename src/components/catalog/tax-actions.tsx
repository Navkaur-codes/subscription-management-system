"use client";
import { ActionButton } from "@/components/shared/action-button";
import { deleteTax, toggleTax } from "@/app/(app)/taxes/actions";

export function TaxRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <>
      <ActionButton variant="ghost" action={() => toggleTax(id)}>
        {isActive ? "Deactivate" : "Activate"}
      </ActionButton>
      <ActionButton
        variant="ghost"
        action={() => deleteTax(id)}
        confirm={{ title: "Delete this tax?", description: "Taxes used by products cannot be deleted.", confirmLabel: "Delete" }}
      >
        Delete
      </ActionButton>
    </>
  );
}

"use client";
import { ActionButton } from "@/components/shared/action-button";
import { deleteTemplate } from "@/app/(app)/templates/actions";

export function TemplateDeleteButton({ id }: { id: string }) {
  return (
    <ActionButton
      action={() => deleteTemplate(id)}
      redirectTo="/templates"
      confirm={{ title: "Delete this template?", description: "Existing subscriptions are not affected.", confirmLabel: "Delete" }}
    >
      Delete
    </ActionButton>
  );
}

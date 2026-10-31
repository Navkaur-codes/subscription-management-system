"use client";
import type { ActionResult } from "@/lib/action";
import { ActionButton } from "@/components/shared/action-button";

/** Generic Deactivate/Activate + Delete pair for catalog rows and detail pages. */
export function ToggleDeleteActions({
  id,
  isActive,
  noun,
  toggle,
  remove,
  redirectAfterDelete,
}: {
  id: string;
  isActive: boolean;
  noun: string;
  toggle: (id: string) => Promise<ActionResult<unknown>>;
  remove: (id: string) => Promise<ActionResult<unknown>>;
  redirectAfterDelete?: string;
}) {
  return (
    <>
      <ActionButton variant="outline" action={() => toggle(id)}>
        {isActive ? "Deactivate" : "Activate"}
      </ActionButton>
      <ActionButton
        variant="outline"
        action={() => remove(id)}
        redirectTo={redirectAfterDelete}
        confirm={{
          title: `Delete this ${noun}?`,
          description: "This cannot be undone. If it is in use, deactivate it instead.",
          confirmLabel: "Delete",
        }}
      >
        Delete
      </ActionButton>
    </>
  );
}

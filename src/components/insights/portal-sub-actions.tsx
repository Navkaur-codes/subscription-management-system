"use client";
import { ActionButton } from "@/components/shared/action-button";
import { closeSubscription, pauseSubscription, resumeSubscription } from "@/app/portal/subscriptions/actions";

export function PortalSubActions({ id, canPause, canResume, canClose }: { id: string; canPause: boolean; canResume: boolean; canClose: boolean }) {
  return (
    <>
      {canPause && (
        <ActionButton
          action={pauseSubscription.bind(null, id)}
          confirm={{ title: "Pause this subscription?", description: "Billing stops until you resume it." }}
        >
          Pause
        </ActionButton>
      )}
      {canResume && <ActionButton action={resumeSubscription.bind(null, id)}>Resume</ActionButton>}
      {canClose && (
        <ActionButton
          variant="destructive"
          action={closeSubscription.bind(null, id)}
          confirm={{ title: "Cancel this subscription?", description: "This closes the subscription and cannot be undone.", confirmLabel: "Cancel subscription" }}
        >
          Cancel subscription
        </ActionButton>
      )}
    </>
  );
}

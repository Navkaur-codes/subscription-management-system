import Link from "next/link";
import { FilePlus2, Pencil } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";
import {
  canRenew,
  SUBSCRIPTION_TRANSITIONS,
  TRANSITION_LABEL,
  transitionBlockReason,
  type PlanFlags,
} from "@/lib/subscription-status";
import { ActionButton } from "@/components/shared/action-button";
import { Button } from "@/components/ui/button";
import { changeStatusAction, renewAction } from "@/app/(app)/subscriptions/actions";
import { EmailQuotationButton } from "./email-quotation-button";

const CONFIRM: Partial<Record<SubscriptionStatus, { title: string; description: string; confirmLabel: string }>> = {
  CLOSED: { title: "Close this subscription?", description: "It will stop billing and cannot be reopened.", confirmLabel: "Close" },
  PAUSED: { title: "Pause this subscription?", description: "No invoices are generated while paused.", confirmLabel: "Pause" },
};

/** Header buttons for a subscription: allowed transitions, renew, edit, email, invoice. */
export function StatusActions({ id, status, plan }: { id: string; status: SubscriptionStatus; plan: PlanFlags }) {
  const moves = SUBSCRIPTION_TRANSITIONS[status].filter((to) => !transitionBlockReason(status, to, plan));
  const editable = status === "DRAFT" || status === "QUOTATION";
  return (
    <>
      {editable && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/subscriptions/${id}/edit`}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>
      )}
      {status === "QUOTATION" && <EmailQuotationButton id={id} />}
      {canRenew(status, plan) && (
        <ActionButton
          action={renewAction.bind(null, id)}
          confirm={{ title: "Renew subscription?", description: "Expiry is extended by one more term.", confirmLabel: "Renew" }}
        >
          Renew
        </ActionButton>
      )}
      {status === "ACTIVE" && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/invoices/new?subscriptionId=${id}`}>
            <FilePlus2 className="size-4" /> Create invoice
          </Link>
        </Button>
      )}
      {moves
        .filter((to) => to !== "CLOSED")
        .map((to) => (
          <ActionButton
            key={to}
            action={changeStatusAction.bind(null, id, to)}
            variant={to === "DRAFT" || to === "PAUSED" ? "outline" : "default"}
            confirm={CONFIRM[to]}
          >
            {TRANSITION_LABEL[to]}
          </ActionButton>
        ))}
      {moves.includes("CLOSED") && (
        <ActionButton action={changeStatusAction.bind(null, id, "CLOSED")} variant="destructive" confirm={CONFIRM.CLOSED}>
          {TRANSITION_LABEL.CLOSED}
        </ActionButton>
      )}
    </>
  );
}

import type { SubscriptionStatus } from "@prisma/client";

/** Allowed status moves. Draft → Quotation → Confirmed → Active → Closed, plus pause/resume. */
export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  DRAFT: ["QUOTATION", "CLOSED"],
  QUOTATION: ["CONFIRMED", "DRAFT", "CLOSED"],
  CONFIRMED: ["ACTIVE", "CLOSED"],
  ACTIVE: ["PAUSED", "CLOSED"],
  PAUSED: ["ACTIVE", "CLOSED"],
  CLOSED: [],
};

export type PlanFlags = { closable: boolean; pausable: boolean; renewable: boolean };

/** Null if allowed, else a human reason. Plan flags restrict pause/close of running subscriptions. */
export function transitionBlockReason(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
  plan: PlanFlags
): string | null {
  if (!SUBSCRIPTION_TRANSITIONS[from].includes(to)) return `Cannot move from ${from} to ${to}`;
  if (to === "PAUSED" && !plan.pausable) return "This plan does not allow pausing";
  if (to === "CLOSED" && (from === "ACTIVE" || from === "PAUSED") && !plan.closable)
    return "This plan cannot be closed early";
  return null;
}

/** Button labels for each transition target. */
export const TRANSITION_LABEL: Record<SubscriptionStatus, string> = {
  DRAFT: "Back to draft",
  QUOTATION: "Send quotation",
  CONFIRMED: "Confirm",
  ACTIVE: "Activate",
  PAUSED: "Pause",
  CLOSED: "Close",
};

/** Renew = extend expiry by one more term; only for renewable plans on ACTIVE/PAUSED subs. */
export function canRenew(status: SubscriptionStatus, plan: PlanFlags) {
  return plan.renewable && (status === "ACTIVE" || status === "PAUSED");
}

/** Subscriptions that count as live/recurring revenue. */
export const LIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE"];

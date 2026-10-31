# Stretch backlog (only after all PS features are merged & tested)

Ordered by demo value ÷ effort. Main decides; each needs its own small plan.

1. **Run billing preview** — `/invoices/run`: list of due subscriptions + "142 invoices will be created, ₹X total" → Confirm. Builds on C's bulk generation (dry-run mode). Owner: C. ~20 min.
2. **Audit trail on subscription status changes** — new `SubscriptionStatusLog` model (Main adds schema), B writes a row in each transition transaction, timeline on detail page. ~25 min.
3. **MRR / churn chart on dashboard** — add `recharts` (Main), D builds monthly MRR (monthlyFactor) + churned subs per month. ~30 min.
4. **Email reminders** — upcoming renewals (expiry in ≤7 days) and overdue invoices; "Send reminders now" button + optional node-cron; `EmailLog` model. Owner: C or D. ~30 min.

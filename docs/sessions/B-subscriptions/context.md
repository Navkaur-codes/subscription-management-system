# Session B — Subscriptions & lifecycle

**Folder** shared `D:/odoo-hackathon` · **Dev** port 3002 (`npm run dev:b`) · **Model** Opus · **Timebox** 1h45m (T+0:45 → T+2:30)

## Goal
Sales/staff create subscriptions (from scratch or a quotation template), move them through Draft → Quotation → Confirmed → Active → Closed (with pause/renew per plan rules), and everyone can see where each one stands.

## You own
`src/app/(app)/subscriptions/**`, `src/lib/subscriptions/**`, `src/lib/validators/subscription.ts`, `src/components/subscriptions/**`

## Build (in order; suggested commit after each)
1. **List** `/subscriptions` — columns: number, customer, plan, status (StatusBadge), start, next invoice, expiry, recurring total (sum of line amounts incl. tax via `priceLines`… or simpler: sum `amount` × (1+taxRate) — use `priceLines` on the lines). Filters: `FilterTabs` status (All/Draft/Quotation/Confirmed/Active/Paused/Closed), `SearchInput` (number or customer name), plan select. Server-side pagination (must be fast with 5,000 rows — select only needed columns, use indexes on status/customerId/planId). Header actions: "New subscription", "Close expired" (ActionButton with confirm → `closeExpiredSubscriptions()`).
2. **Create/edit form** `/subscriptions/new` and `/subscriptions/[id]/edit` (edit allowed only in DRAFT/QUOTATION):
   - customer (select / searchable via Command popover; link "Add customer" → `/customers/new`), plan (only active plans whose availability window includes today), startDate (default today), expiryDate (default start + 12 periods, or 1 year for yearly), paymentTerms (days, default 15), discount (optional select of active discounts — show `discountReason` hint if not applicable), notes.
   - **Lines editor** (client): product select → variant select (filtered) → quantity → unitPrice auto = `unitPrice(product.salesPrice, variant.extraPrice)` (editable) → taxRate auto = `sumTaxRates(product.taxes)` → amount. Live totals panel with `priceLines(lines, discountRule)`: Subtotal, Discount, Tax, Total.
   - Validate: ≥1 line; total quantity ≥ plan.minQuantity; expiry > start.
   - `?templateId=` prefill: plan, paymentTerms, lines from QuotationTemplate; quotationExpiry = today + validityDays.
   - Save in `db.$transaction`: `nextNumber("SUB", tx)`, create subscription + lines (`amount` = qty × unitPrice). `createdById` = session.userId.
3. **Detail** `/subscriptions/[id]` — header: number + StatusBadge (wrap in `<Pulse trigger={status}>`) + action buttons; Sections: Overview (DetailList: customer link, plan, period, start, expiry, next invoice, payment terms, discount, created by), Lines table with totals, **Invoices** (query `db.invoice` where subscriptionId — number, date, due, status via `displayStatus`, total; rows link to `/invoices/[id]`), and a status **progress stepper** (Draft → Quotation → Confirmed → Active → Closed, current highlighted with brand colour, Paused shown as a side state).
4. **Lifecycle actions** `src/lib/subscriptions/lifecycle.ts` + `actions.ts`:
   - `changeStatus(id, to)` — guard with `transitionBlockReason(from, to, plan)`; side effects: → ACTIVE sets `nextInvoiceDate = startDate` if null (or today if start in past and never invoiced); → CLOSED sets closedAt and nextInvoiceDate = null; PAUSED → ACTIVE keeps nextInvoiceDate but if it is in the past set it to today.
   - `renewSubscription(id)` — only if `canRenew`; expiryDate += same term length (12 periods / 1 year).
   - `closeExpiredSubscriptions()` — ACTIVE/PAUSED subs whose plan.autoClose and expiryDate < now → CLOSED. Returns count.
   - Buttons shown only for allowed transitions (use `SUBSCRIPTION_TRANSITIONS[status]` + `TRANSITION_LABEL`), Close/Pause behind confirm dialogs.
   - **"Create invoice"** button (status ACTIVE) → plain link to `/invoices/new?subscriptionId=<id>` (Session C implements it). Don't import C's code.
5. **Quotation send** (QUOTATION state): "Email quotation" button → `sendMail` with a simple summary (lines + total, validity) to customer email; toast includes preview link (`previewUrl`).

## Acceptance checklist
- [ ] Create from scratch and from template "Enterprise CRM bundle" (prefilled lines incl. Odoo variant +560)
- [ ] Totals match `priceLines` (discount + tax), min-quantity rule enforced
- [ ] Full flow Draft → Quotation → Confirmed → Active → Paused → Active → Closed; illegal moves blocked server-side; pause blocked for "Business Yearly" (not pausable); renew extends expiry
- [ ] "Close expired" closes autoClose subs past expiry
- [ ] List with 5k rows paginates/filter < 2s
- [ ] Only ADMIN/STAFF can access; typecheck passes; design rules followed

## Requests to Main
(none yet)

## Status
- [x] 1 List `/subscriptions` (filters, search, plan select, pagination, Close expired)
- [x] 2 Create/edit form + lines editor + live totals + `?templateId=` prefill
- [x] 3 Detail page (stepper, overview, lines+totals, invoices)
- [x] 4 Lifecycle (`src/lib/subscriptions/lifecycle.ts`): changeStatus, renew, closeExpired
- [x] 5 Email quotation (Ethereal preview in toast)
- Verified in browser: template "Enterprise CRM bundle" → SUB/2026/00010 (Odoo +560 variant, ₹68,145 total), Draft→Quotation→Confirmed→Active, Pause hidden for Business Yearly, Renew 2027→2028, Close expired (0 eligible).
- Not browser-tested: pause/resume on a pausable plan, 5k-row timing (bulk seed not run). Typecheck + lint clean for B files (C's `invoices/new` had type errors at last check).
- Note: added a `dev-b` entry to `.claude/launch.json` (untracked tool config).

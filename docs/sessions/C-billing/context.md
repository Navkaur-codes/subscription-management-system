# Session C — Invoices, billing day & payments

**Folder** shared `D:/odoo-hackathon` · **Dev** port 3003 (`npm run dev:c`) · **Model** Opus · **Timebox** 1h45m (T+0:45 → T+2:30)

## Goal
No invoice is typed by hand: invoices are generated from subscriptions (customer, lines, taxes, discounts, totals prefilled), billed exactly once per period, moved Draft → Confirmed → Paid, sent/printed, and payments recorded against them so paid vs outstanding vs overdue is always visible.

## You own
`src/app/(app)/{invoices,payments}/**`, `src/lib/billing/**`, `src/lib/validators/billing.ts`, `src/components/billing/**`

## Build (in order; suggested commit after each)
1. **Generator** `src/lib/billing/generate.ts`:
   - `generateInvoiceForSubscription(subscriptionId, tx?)`: load sub (status must be ACTIVE, nextInvoiceDate not null) with lines (+product name, variant), plan, customer, discount(+products). Period = `periodRange(sub.nextInvoiceDate, plan.billingPeriod)`. Price with `priceLines(lines→{productId,quantity,unitPrice,taxRate}, discountRule, periodStart)`. In ONE `db.$transaction`: `nextNumber("INV", tx)`, create Invoice (status DRAFT, invoiceDate today, dueDate = today + sub.paymentTerms days, period, totals, discountId if applied) + InvoiceLines (description = product name + variant), increment `discount.usedCount` if applied, set `sub.nextInvoiceDate = periodEnd`. If `periodStart` already invoiced → unique constraint (P2002) → treat as "already billed" (skip, no error). Don't bill past `expiryDate`.
   - `generateDueInvoices()`: all ACTIVE subs with `nextInvoiceDate <= endOfToday` (batched, e.g. 200 at a time) → loop generator; returns `{created, skipped, total}`. Loop per sub while nextInvoiceDate still ≤ today (catch-up), max 12 per sub.
2. **Routes**
   - `/invoices/new?subscriptionId=…` — server page: calls generator, then `redirect("/invoices/<id>")`; if nothing due, redirect back to `/subscriptions/<id>?msg=…` or show a small explanation page.
   - `/invoices` — list: number, customer, subscription, invoice date, due date, status (`displayStatus` → shows OVERDUE/PARTIAL), total, outstanding. `FilterTabs` status: All / Draft / Confirmed / **Outstanding** / **Overdue** / Paid / Cancelled (Outstanding = CONFIRMED with amountPaid < total, Overdue = `overdueWhere()`), search (number/customer), date range (from/to on invoiceDate). Summary strip above table: count, total, outstanding for current filter (aggregate query). Header action: **"Generate due invoices"** (ActionButton confirm → `generateDueInvoices()`; toast "N invoices created").
   - `/invoices/[id]` — `InvoiceDocument` (shared, query with `invoiceDocumentInclude`) + action bar (`no-print`): Confirm (DRAFT→CONFIRMED), Cancel (confirm dialog; not if payments exist), **Send** (email with summary + total + due date via `sendMail`, sets `sentAt`; toast shows preview link), **Print** (`PrintButton`), **Register payment** (Sheet/Dialog, only CONFIRMED), link to subscription.
3. **Payments** `src/lib/billing/payments.ts` + actions:
   - `recordPayment({invoiceId, method, amount, paymentDate, note, reference})`: invoice must be CONFIRMED; amount > 0 and ≤ outstanding; transaction: create Payment (recordedById), increment amountPaid, if amountPaid ≥ total → status PAID, paidAt.
   - `/payments` — list of all payments: date, invoice number (link), customer, method, amount, note; filters method + date range + search; summary total.
4. **Status guards**: use `INVOICE_TRANSITIONS`; all actions `requireRole("ADMIN","STAFF")`.

## Acceptance checklist
- [ ] From an ACTIVE subscription, `/invoices/new?subscriptionId=` creates a correct invoice (lines, taxes, discount, totals) and redirects
- [ ] "Generate due invoices" twice → second run creates 0 (no double billing); nextInvoiceDate advances
- [ ] Discount "Bulk seats 10%" (min qty 10) appears automatically on invoice for a 12-seat sub; usedCount increments; expired discount never applies
- [ ] Confirm / Cancel / Send (Ethereal preview) / Print work; illegal transitions blocked
- [ ] Partial payment → PARTIAL badge; full → PAID; overpay rejected
- [ ] Outstanding / Overdue filters correct; lists fast on 20k invoices
- [ ] typecheck passes; design rules followed

## Requests to Main
(none yet)

## Status
- [ ] Not started

# Session A — Catalog & Admin configuration

**Folder** shared `D:/odoo-hackathon` · **Dev** port 3001 (`npm run dev:a`) · **Model** Sonnet · **Timebox** 1h45m (T+0:45 → T+2:30)

## Goal
Admin sets up everything the business sells: products (with variants), plans, taxes, discounts, quotation templates. Staff can view all of it, only ADMIN can create/edit/delete.

## You own
`src/app/(app)/{products,plans,taxes,discounts,templates}/**`, `src/lib/validators/catalog.ts`, `src/components/catalog/**`

## Build (in this order; suggested commit after each)
1. **Taxes** `/taxes` — table (name, rate %, active) + create/edit in a `Sheet`; toggle active. Delete only if unused (else deactivate).
2. **Products** `/products` (list: name, type, sales price, cost price, #variants, taxes, active; search `q`, filter type) → `/products/new`, `/products/[id]` (one form page for create/edit):
   - fields: name, type (SERVICE/GOODS), salesPrice, costPrice, notes, taxes (checkbox list of active taxes), isActive
   - **Variants editor** inline on the same form: rows of attribute, value, extraPrice (+ add/remove row). Show computed "Final price" = `unitPrice(salesPrice, extraPrice)`. Example to demo: Brand = Odoo → +560.
   - Save in one `db.$transaction` (replace variants & taxes: deleteMany + create; keep variants that are referenced by subscription lines — update instead of delete).
3. **Plans** `/plans` (list: name, price, period, min qty, availability window, flags as small text, active) → `/plans/new`, `/plans/[id]`:
   - fields: name, price, billingPeriod (daily/weekly/monthly/yearly), minQuantity, startDate, endDate (end ≥ start), autoClose, closable, pausable, renewable (Switches with one-line explanations), isActive, notes.
4. **Discounts** `/discounts` — **ADMIN only, including viewing** (requireRole("ADMIN") on page and actions; staff gets /forbidden):
   - list: name, code, type+value (e.g. "10%" or "₹200"), scope, validity, usage "used/limit", status (StatusBadge: Active / Expired / Exhausted / Inactive via tone).
   - form: name, code (optional, uppercase, unique), type FIXED/PERCENT (percent ≤ 100), value, scope SUBSCRIPTION/PRODUCT (if PRODUCT → product multi-select checkbox list), minPurchase, minQuantity, startDate, endDate, usageLimit (blank = unlimited). usedCount is read-only.
5. **Quotation templates** `/templates` (list: name, plan, #lines, validity days) → `/templates/new`, `/templates/[id]`:
   - fields: name, plan (select active plans), validityDays, paymentTerms (days), notes, lines editor (product select → variant select filtered by product, quantity ≥ plan.minQuantity), live preview of totals using `priceLines` (no discount).
   - Detail/edit page has button **"Use template"** → link `/subscriptions/new?templateId=<id>` (B builds that route).

## Acceptance checklist
- [ ] All 5 modules list → create → edit → (deactivate/delete) work as ADMIN with Zod errors shown per field
- [ ] STAFF sees products/plans/taxes/templates read-only (no create/edit buttons; actions reject with fail("Only admins…")); STAFF blocked from /discounts
- [ ] Product with Brand=Odoo variant shows +₹560 and final price
- [ ] Plan end date before start date is rejected
- [ ] Percent discount > 100 rejected; PRODUCT scope requires ≥1 product
- [ ] Lists paginated + searchable; uses DataTable/PageHeader/StatusBadge; no raw colour classes
- [ ] `npm run typecheck` passes

## Notes
- Reads of other tables fine (e.g. count subscription lines before deleting a product).
- Use `revalidatePath("/products")` etc. after mutations.

## Requests to Main
(none yet)

## Status
- [x] 1 Taxes  - [x] 2 Products  - [x] 3 Plans  - [x] 4 Discounts  - [x] 5 Templates (typecheck + lint pass; not browser-tested)

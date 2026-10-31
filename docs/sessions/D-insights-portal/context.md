# Session D — Dashboard, reports, customers, team & customer portal

**Folder** shared `D:/odoo-hackathon` · **Dev** port 3004 (`npm run dev:d`) · **Model** Sonnet · **Timebox** 1h45m (T+0:45 → T+2:30)

## Goal
The finance lead sees active subscriptions, revenue, payments and overdue invoices in one place with filters and a summary, every page < 2s with thousands of rows. Staff manage customers; admin adds staff. Customers self-serve through a portal showing only their own data.

## You own
`src/app/(app)/{dashboard,reports,customers,users}/**`, `src/app/portal/{page.tsx,subscriptions,invoices}/**`, `src/lib/insights/**`, `src/lib/validators/{customer,user}.ts`, `src/components/insights/**`

## Build (in order; suggested commit after each)
1. **Customers** `/customers` (list: name, company, email, city, #active subs, outstanding; search) → `/customers/new`, `/customers/[id]` (edit form: name, email unique, phone, company, address, city, gstin + read-only tabs/sections: subscriptions, invoices with status, total paid, outstanding). ADMIN/STAFF. **Build this first — B's form links to /customers/new.**
2. **Team members** `/users` — ADMIN only: list users with role STAFF/ADMIN (name, email, role, active, created). "Add staff member" Sheet: name, email, temp password (use `passwordSchema` from `@/lib/validators/auth`), role STAFF (or ADMIN). Activate/deactivate (can't deactivate yourself). Customers' accounts are not managed here.
3. **Dashboard** `/dashboard` — `src/lib/insights/metrics.ts` using few aggregate queries (`count`, `aggregate`, `groupBy`; run in `Promise.all`):
   - KPI StatCards (wrap grid in `<Stagger>`, numbers in `<CountUp>`): Active subscriptions · Recurring revenue / month (sum over ACTIVE subs of line amounts × `monthlyFactor(plan.billingPeriod)` — do with one raw SQL or groupBy by plan) · Revenue collected this month (payments sum) · Outstanding (CONFIRMED invoices total − amountPaid) · Overdue invoices (count + amount, tone danger).
   - Sections: "Overdue invoices" top 8 (link to `/invoices/[id]`), "Recent payments" top 8, "Subscriptions by status" (simple horizontal bars made with divs, width %, monochrome — no chart lib), "Revenue last 6 months" (div bar chart from payments grouped by month, monochrome bars with brand colour for current month).
4. **Reports** `/reports` — tabs (`FilterTabs` param `view`): **Subscriptions** | **Invoices** | **Payments**. Common filters: date range (from/to), status, plan, customer search. Each tab: summary row (count, totals: e.g. invoiced, paid, outstanding) via aggregate + paginated DataTable. "Export CSV" button → route handler `src/app/(app)/reports/export/route.ts` streaming CSV for current filters (cap 10k rows).
5. **Customer portal** (`requireRole("CUSTOMER")`, every query filtered by `session.customerId` — never trust ids from URL alone):
   - `/portal` overview: greeting, StatCards (active subscriptions, next invoice date, amount due), lists of current subscriptions and unpaid invoices.
   - `/portal/subscriptions` + `/portal/subscriptions/[id]`: plan, status, lines, totals, next invoice, expiry; actions **Pause** / **Resume** / **Cancel (close)** only if `transitionBlockReason` allows (plan flags) — confirm dialog.
   - `/portal/invoices` + `/portal/invoices/[id]`: `InvoiceDocument` + `PrintButton` + payment history.

## Acceptance checklist
- [ ] Dashboard figures correct against seed; loads < 2s with `npm run seed:bulk` data (5k subs / ~20k invoices)
- [ ] Reports filters + summary + pagination + CSV export work
- [ ] Customers CRUD; duplicate email rejected
- [ ] Only ADMIN can add staff; STAFF hitting /users → /forbidden; new staff can log in
- [ ] Portal: customer@brightloop.test sees only Kiran's subscriptions/invoices; another customer's invoice id → 404; pause/cancel follow plan rules
- [ ] typecheck passes; monochrome design (no raw colour classes)

## Requests to Main
(none yet)

## Status
- [ ] Not started

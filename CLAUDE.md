# Brightloop — Subscription Management System (Odoo Hackathon)

One platform to run plans, subscriptions, recurring invoices, payments and revenue reporting for "Brightloop Software". Roles: **ADMIN** (everything), **STAFF** (day-to-day, limited), **CUSTOMER** (portal: own subscriptions & invoices only).

**Deadline: all PS features merged by T+3h.** Build exactly what your context file lists — no extras unless Main says so.

## Read first (and only these)
1. This file.
2. `docs/CONTRACTS.md` — schema summary, shared functions, routes, status rules.
3. Your own `docs/sessions/<you>/context.md`.
Do **not** explore the rest of the repo. Open a shared file only when you need its exact signature.

## Stack (installed — do not add libraries without asking Main)
Next.js 15 App Router + TS · React 19 · Tailwind v4 · shadcn/ui (radix) in `src/components/ui` · Prisma 6 + PostgreSQL (Neon) · Zod 3 · react-hook-form · bcryptjs + jose · Nodemailer (Ethereal fallback) · GSAP + @gsap/react · sonner toasts · date-fns · lucide-react.

## Commands
`npm run dev -- -p <your port>` · `npm run typecheck` · `npm run build` · `npm run seed` · `npm run seed:bulk` · `npx prisma studio`
Seed logins (password **Brightloop@123**): `admin@brightloop.test`, `staff@brightloop.test`, `customer@brightloop.test`.

## File ownership (HARD RULE)
| Owner | Paths |
|---|---|
| **Main only** | `prisma/**`, `src/lib/*.ts` (top level), `src/lib/validators/auth.ts`, `src/components/ui/**`, `src/components/shared/**`, `src/components/motion/**`, `src/components/shell/**`, `src/app/(auth)/**`, `src/app/(app)/layout.tsx`, `src/app/portal/layout.tsx`, `src/app/portal/portal-nav.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/middleware.ts`, `package.json`, `CLAUDE.md`, `docs/CLAUDE.md`, `docs/CONTRACTS.md` |
| **A – Catalog** | `src/app/(app)/{products,plans,taxes,discounts,templates}/**`, `src/lib/validators/catalog.ts`, `src/components/catalog/**` |
| **B – Subscriptions** | `src/app/(app)/subscriptions/**`, `src/lib/subscriptions/**`, `src/lib/validators/subscription.ts`, `src/components/subscriptions/**` |
| **C – Billing** | `src/app/(app)/{invoices,payments}/**`, `src/lib/billing/**`, `src/lib/validators/billing.ts`, `src/components/billing/**` |
| **D – Insights & Portal** | `src/app/(app)/{dashboard,reports,customers,users}/**`, `src/app/portal/{page.tsx,subscriptions,invoices}/**`, `src/lib/insights/**`, `src/lib/validators/{customer,user}.ts`, `src/components/insights/**` |

Need a schema field, shared helper, nav change or new package? **Don't edit it.** Add a line under "Requests to Main" in your context.md and tell the user. Reading any table from any module is fine.

## Coding conventions
- Pages are **server components** that query `db` directly (`import { db } from "@/lib/db"`). Interactive bits are small `"use client"` components next to the page.
- Mutations = **server actions** in `actions.ts` inside the route folder. Each action: `"use server"` → `await requireRole(...)` first → Zod `parse` → `db` work (use `db.$transaction` when touching >1 table) → `revalidatePath()` → return `ActionResult` via `ok()/fail()/toFail()` from `@/lib/action`.
- Validation schemas live in your `src/lib/validators/<module>.ts`. Use `z.coerce.number()` / `z.coerce.date()` for form inputs.
- Money: Prisma `Decimal`. Convert with `toNum()`, display with `formatMoney()` (₹, en-IN). **All price/tax/discount maths through `@/lib/pricing`** (`priceLines`, `unitPrice`, `sumTaxRates`). Never re-implement.
- Dates: `formatDate()`, `toDateInput()` from `@/lib/format`; period maths `addPeriod()` from `@/lib/dates`.
- Document numbers: `nextNumber("SUB"|"INV", tx)` from `@/lib/numbering`.
- Status rules: `@/lib/subscription-status` (transitions + plan flags), `@/lib/invoice-status` (outstanding, overdue, displayStatus).
- Lists: server-side pagination with `pageParams(searchParams)` + `PAGE_SIZE` from `@/lib/action`, `db.x.findMany({ skip, take })` + `db.x.count()` in `Promise.all`. Filters via query params. Never load whole tables.
- Next 15: `params` and `searchParams` are **Promises** — `const { id } = await params`.
- Roles: mutations on catalog (products/plans/taxes/discounts/templates) = ADMIN only; STAFF can view. Discounts & team members: ADMIN only. Hide buttons the role can't use **and** enforce in the action.
- No `any`, no `console.log` left behind, no commented-out code. Keep files < ~250 lines; split components.

## Design system (professional, monochrome — NO colourful UI)
- Use tokens only: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border`, `bg-primary` (near-black), `text-brand`/`bg-brand-soft` (single indigo accent, sparingly), `text-destructive` (danger only).
- **Never** use raw palette classes (`bg-blue-500`, `text-green-600`, `bg-red-100` …) or gradients.
- Status → always `<StatusBadge status=… />` (outline pill + tiny dot). No filled coloured badges.
- Page skeleton: `<PageHeader title description actions />` → `<Toolbar>` (SearchInput / FilterTabs) → `<DataTable columns rows rowHref />` → `<Pagination />`. Detail pages: `<Section>` cards + `<DetailList>`. KPIs: `<StatCard>`. Empty: `<EmptyState>`.
- Forms: shadcn `Input/Select/Textarea/Switch/Checkbox` inside `<FormField label error hint>` in `<FormGrid>`. Create/edit in a dedicated page (`/x/new`, `/x/[id]`) or a `Sheet` for small entities. Primary action = default `Button`, secondary = `variant="outline"`, destructive behind `<ActionButton confirm=…>`.
- Toasts via `sonner` (`toast.success/error`). Icons: lucide, `size-4`.
- Money columns right-aligned (`align: "right"` in DataTable adds tabular numbers). Dates `dd MMM yyyy`.
- Spacing: page sections `space-y-6`, cards `rounded-xl border bg-card`, no heavy shadows.

## Animation (GSAP) — must never slow the app
Use only `src/components/motion`: `<FadeIn>`, `<Stagger>` (wrap a DataTable/StatCard grid; animates first 12 `[data-stagger]` items), `<CountUp>` (KPI numbers), `<Pulse trigger>` (status change). The app layout already fades page content in. Do not import `gsap` directly; no scroll-triggered or per-row infinite animations.

## Status rules (from PS)
- Subscription: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED; ACTIVE ⇄ PAUSED (if plan.pausable); close early only if plan.closable; renew only if plan.renewable; plan.autoClose → closes at expiry.
- Invoice: DRAFT → CONFIRMED → PAID (auto when amountPaid ≥ total); DRAFT/CONFIRMED → CANCELLED. OVERDUE/PARTIAL are derived (`displayStatus`). One invoice per subscription period (`@@unique([subscriptionId, periodStart])`).
- Discount auto-applies on the next invoice if valid (dates, usage limit, min purchase/qty) and increments `usedCount`.

## Token economy (we have a 5-hour Claude budget)
- Don't spawn subagents. Don't re-read files after editing them. Don't print whole files back.
- Read signatures, not whole libraries. Skip exploring `node_modules` / shadcn sources unless an import fails.
- Run `npm run typecheck` at milestones, not after every edit. Replies: short status lines.

## Git
You work in your own worktree/branch. Commit at each checklist milestone: `feat(<module>): <what>` (end message with the Co-Authored-By line if configured). Never commit `.env`. Never rebase/merge other branches — Main merges.

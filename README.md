# Brightloop — Subscription Management System

> One platform to run plans, subscriptions and recurring billing — from setting up products to sending invoices, collecting payments and reporting revenue.
> Built for the **Odoo Hackathon** problem statement *"Subscription Management System"* (Brightloop Software).

**Stack:** Next.js 15 (App Router) · TypeScript · PostgreSQL (Neon) + Prisma · Tailwind CSS v4 + shadcn/ui · GSAP · Recharts

---

## Try it in 30 seconds

The sign-in page has one-click demo buttons — **Admin**, **Staff**, **Customer**. Or sign in manually:

| Role | Email | Password | Lands on |
|---|---|---|---|
| Admin | `admin@brightloop.test` | `Brightloop@123` | Dashboard — full access |
| Staff | `staff@brightloop.test` | `Brightloop@123` | Dashboard — day-to-day work, catalog read-only |
| Customer | `customer@brightloop.test` | `Brightloop@123` | Customer portal — own data only |

The seeded database holds **5,000 subscriptions, ~10,000 invoices and ~8,000 payments**, so every list, report and chart has realistic data.

### Five-minute walkthrough

1. **Admin → Catalog:** open *Products* (Brightloop CRM has the *Brand: Odoo +₹560* variant), *Plans* (pricing cards with rules), *Discounts* (*Bulk seats 10%* for 10+ seats).
2. **Staff → Quotation templates → "Enterprise CRM bundle" → Use template:** pick a customer, create the subscription, then walk it *Send quotation → Confirm → Activate*.
3. **Create invoice** on the active subscription — the 10% bulk discount is applied automatically and tax is charged on the discounted amount. *Confirm* it, then *Send* (email) or *Print*.
4. **Invoices → Generate due invoices:** preview how many subscriptions are due and the total, confirm, then run it again — it creates nothing, because each period is billed once.
5. **Register payment** on an invoice: a partial amount shows *Partial*, the rest makes it *Paid*; see it land on *Payments* and the *Dashboard*.
6. **Customer → Portal:** only Kiran's own subscriptions and invoices; pause / resume a plan that allows it; print an invoice.
7. **Forgot password** from the sign-in page → reset link by email → set a new password.

---

## Problem statement → what we built

| Scene from the PS | How Brightloop handles it |
|---|---|
| **A new customer signs up** | Sign-up with unique email and the exact password rule (> 8 chars, upper, lower, special). Forgot-password sends a one-time, 1-hour reset link by email. Three roles: **Admin** (everything), **Staff** (limited), **Customer** (portal). Only the admin can add staff. Roles are enforced in middleware *and* in every server action. |
| **Launching a new plan** | Products with name, type, sales price, cost price, notes, taxes and **variants** (e.g. *Brand: Odoo → +₹560*). Plans with price, billing period (daily / weekly / monthly / yearly), minimum quantity, availability dates, and per-plan rules: **auto-close, closable, pausable, renewable**. |
| **Turning a quote into a subscription** | **Quotation templates** (plan + product lines + validity days) prefill a new subscription. Each subscription has its own number (`SUB/2026/00001`), customer, plan, start/expiry dates, payment terms and lines (product, qty, unit price, tax, amount). Lifecycle **Draft → Quotation → Confirmed → Active → Closed** (+ Paused / Renew per plan rules), shown as a stepper on every subscription. |
| **Billing day** | **Generate due invoices** bills every active subscription that is due, with a preview of how many invoices and the total before you confirm. Each invoice is built from its subscription — customer, lines, taxes, discounts, totals. **Nothing is billed twice**: a database unique key on *(subscription, period)*. Invoices move **Draft → Confirmed → Paid** and can be confirmed, cancelled, sent by email or printed. |
| **A customer asks for a better price** | Admin-only **discount rules**: fixed or %, minimum purchase / quantity, start & end dates, usage limit, scope = specific products or whole subscription. A valid discount is **applied to the next invoice automatically** and stops when it expires or runs out (usage is counted atomically). |
| **The money comes in** | Open an invoice → **Register payment** with method (Cash / Bank transfer / Card / UPI / Cheque), amount, date and note. Partial payments supported; overpayment blocked; the invoice turns **Paid** automatically. Paid / Outstanding / **Overdue** views, and a *Payments* page with collections KPIs, split by method and full history. |
| **The finance lead, end of month** | **Dashboard**: active subscriptions, recurring revenue (MRR) with 12-month trend, collected this month, outstanding, overdue — each with month-on-month change. **Reports** for subscriptions, invoices and payments with filters, summary totals and **CSV export**. Every page stays **well under 2 seconds** on 5,000+ subscriptions (measured 150–710 ms on a production build). |
| **Customers self-serve** | **Customer portal**: own subscriptions and invoices, print invoices, payment history, and pause / resume / cancel where the plan allows. Every query is scoped to the signed-in customer — another customer's record returns 404. |

---

## Feature tour

**Admin / Staff app**
- **Dashboard** — live hero with recurring revenue, payments ticker, KPI strip with sparklines, MRR area chart, invoiced-vs-collected bars, subscriptions-by-status donut, top plans, overdue invoices, recent payments.
- **Subscriptions** — status tabs with counts, search, filters, summary strip; create from scratch or from a template; detail page with lifecycle stepper, billing summary, invoices and timeline.
- **Invoices** — Outstanding / Overdue / Paid filters with live totals; billing run; printable invoice document; send by email; register payment.
- **Payments** — collections KPIs, split by method, searchable history.
- **Catalog** — products with variants and margin, plans as pricing cards, taxes, discount rules in plain language with usage bars, quotation templates.
- **Customers** & **Team members** (admin adds staff).
- **⌘K / Ctrl K command palette** — jump to any page or search customers, subscriptions and invoices.
- Light & dark mode, responsive down to phone width.

**Customer portal** — overview, subscriptions (pause / resume / cancel per plan rules), invoices (view, print, payment history).

---

## Design

Brightloop has its own identity, **"Ember Loop"** — warm paper and ink with a single ember accent, editorial serif headlines (Instrument Serif), Geist for UI and Geist Mono for numbers.

The signature visual is **the loop**: on the sign-in screen an orbit shows the product's lifecycle — *Plan → Subscription → Invoice → Payment* — with an ember payment travelling around it and lighting each station. Motion is built with **GSAP** (SplitText headline reveals, ScrambleText numbers, DrawSVG, MotionPath, Flip) and respects `prefers-reduced-motion`. Full spec: [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Architecture

```
src/
  app/
    (auth)/        login · signup · forgot / reset password
    (app)/         admin & staff app — dashboard, subscriptions, invoices, payments,
                   customers, reports, catalog (products, plans, taxes, discounts, templates), users
    portal/        customer portal
  lib/
    pricing.ts              single source of truth for line, tax and discount maths
    subscription-status.ts  allowed transitions + plan rules
    invoice-status.ts       outstanding / overdue / partial (derived, not stored)
    billing/                invoice generation, bulk billing, payments
    numbering.ts            concurrency-safe SUB/INV numbers
    auth.ts · session.ts    bcrypt + signed JWT cookie, role guards
    mail.ts                 SMTP or Ethereal test inbox
  components/
    shared/  ui/  motion/  shell/
prisma/
  schema.prisma   data model     seed.ts   demo + bulk data
```

**Key decisions**
- **Server components + server actions** — pages query the database directly; every mutation is a server action that checks the role, validates with Zod and runs in a transaction where it touches more than one table.
- **One pricing engine** — subscriptions and invoices both use `lib/pricing.ts`, so totals always match. Tax is charged on the discounted amount; fixed discounts are spread proportionally across eligible lines.
- **No double billing by construction** — `@@unique([subscriptionId, periodStart])` on invoices; a duplicate attempt is treated as "already billed".
- **Bulk billing that can't hang** — the billing run processes subscriptions in parallel with a 20-second budget and tells you if more are still due.
- **Fast at scale** — server-side pagination everywhere, indexes on status / customer / dates, and aggregate SQL for dashboard metrics.

**Data model:** User · Customer · Product · ProductVariant · Tax · Plan · Discount · QuotationTemplate (+ lines) · Subscription (+ lines) · Invoice (+ lines) · Payment · PasswordResetToken · Sequence. Details in [`docs/CONTRACTS.md`](docs/CONTRACTS.md).

---

## Run it locally

**Requirements:** Node.js 20+ and a PostgreSQL database (a free [Neon](https://neon.tech) project works).

```bash
git clone https://github.com/Navkaur-codes/subscription-management-system.git
cd subscription-management-system
npm install
cp .env.example .env        # then fill in the values below
npx prisma migrate deploy   # create the tables
npm run seed:bulk           # demo data (or `npm run seed` for a small set)
npm run dev                 # http://localhost:3000
```

**Environment variables** (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon: the *pooled* one) |
| `DIRECT_URL` | Direct connection string, used for migrations |
| `AUTH_SECRET` | Long random string that signs session cookies |
| `APP_URL` | Base URL used in password-reset links, e.g. `http://localhost:3000` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional — real email delivery |

**Scripts:** `dev` · `build` · `start` · `lint` · `typecheck` · `db:migrate` · `db:studio` · `seed` · `seed:bulk`

> `npm run seed` / `seed:bulk` **wipe and recreate** all data. After re-seeding, sign out and back in.

### Email

Emails are sent for password reset, invoice delivery and quotations.

- **No SMTP configured (default):** mail goes to a free [Ethereal](https://ethereal.email) test inbox and the app shows an *"Open test inbox preview"* link — everything works with zero setup.
- **SMTP configured:** set the `SMTP_*` variables and restart — real delivery to the user's inbox, no code change. Verified with Gmail:
  1. Turn on 2-Step Verification for a personal Google account, then create an App Password at <https://myaccount.google.com/apppasswords>.
  2. In `.env`: `SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="587"`, `SMTP_USER` = your Gmail, `SMTP_PASS` = the 16-character app password (no spaces), `MAIL_FROM="Brightloop Billing <your Gmail>"`.
  3. **Restart the server** — the mail connection is created once at start-up.
  4. Sign up with a real address, then use *Forgot password* — the reset link arrives in that inbox (check Spam the first time).

  Seeded customers use placeholder addresses (`*.test`), so send test mail only to an account you created with a real email.

---

## Built with

Next.js 15 · React 19 · TypeScript · Prisma 6 · PostgreSQL (Neon) · Tailwind CSS v4 · shadcn/ui (Radix) · GSAP 3 · Recharts · Zod · react-hook-form · bcryptjs · jose · Nodemailer · date-fns · lucide-react

Developed solo for the Odoo Hackathon, using a coordinated set of parallel AI coding sessions with shared contracts ([`docs/CLAUDE.md`](docs/CLAUDE.md) has the build log).

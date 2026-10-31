# Build log & plan (progressive — Main session updates this after every phase)

> Global rules live in `/CLAUDE.md`. This file is the running plan + status board. Sessions read it only if Main asks.

## Plan summary
- PS: Subscription Management System for "Brightloop Software" (Odoo hackathon, 8h, solo).
- Strategy: Main builds foundation (Phase 0) → 4 parallel sessions in git worktrees (Phase 1) → Main merges & integrates (Phase 2) → testing, polish, video.
- **Feature-complete target: T+3:00.** Claude usage budget: 5h → lean prompts, no subagents, Sonnet for A/D, Opus for B/C.
- Stack: Next.js 15 + TS, Tailwind v4 + shadcn (radix), Prisma 6 + Neon Postgres, Zod, jose/bcrypt auth, Nodemailer+Ethereal, GSAP.
- Design: monochrome zinc + single indigo accent; outline status pills with dot; GSAP only via `src/components/motion`.
- Scope = PS only. Extras parked in `docs/STRETCH.md`.

## Timeline
| Phase | Window | Status |
|---|---|---|
| 0 Foundation (Main) | T+0:00 → 0:45 | done |
| 1 Parallel build (A, B, C, D) | T+0:45 → 2:30 | running |
| 2 Merge & integrate (Main) | T+2:30 → 3:00 | pending |
| 3 Testing & polish | T+3:00 → 5:00 | pending |
| 4 Demo script + video | T+5:00 → 7:00 | pending |
| 5 Buffer & submit | T+7:00 → 8:00 | pending |

## Sessions board
| Session | Scope | Folder | Port | Model | Status |
|---|---|---|---|---|---|
| A | Catalog: products+variants, plans, taxes, discounts, templates | shared | 3001 | Sonnet | running |
| B | Subscriptions: CRUD, template prefill, lifecycle, auto-close | shared | 3002 | Opus | running |
| C | Invoices: generation, bulk billing, send/print, payments | shared | 3003 | Opus | running |
| D | Dashboard, reports, customers, team, customer portal | shared | 3004 | Sonnet | running |

Phase 2 = integration in place (no merges): run full typecheck/build, fix seams, bulk seed, click-through.

## Phase 0 — delivered
- Next.js scaffold, shadcn components, monochrome theme tokens (`globals.css`)
- Prisma schema (all models, frozen), seed (3 logins, catalog, 12 customers, demo subs/invoices; `seed:bulk` = +5k subs)
- Shared libs: db, auth/session (JWT cookie), action results & pagination, pricing, format, dates, numbering, mail, subscription-status, invoice-status, auth validators
- Shared UI: PageHeader/Section, DataTable/EmptyState, StatusBadge, list controls (Search/FilterTabs/Toolbar/Pagination), FormField/FormGrid, StatCard/DetailList, ActionButton, InvoiceDocument, PrintButton; motion (FadeIn/Stagger/CountUp/Pulse)
- Auth: signup (PS password rules, unique email), login, logout, forgot/reset via emailed token; middleware role routing
- App shell: sidebar (role-filtered), topbar + mobile sheet, portal shell; placeholder page for every route

## Decisions
- Money stored as `Decimal(12,2)`; all maths via `src/lib/pricing.ts` (tax on post-discount amount; FIXED discount spread proportionally over eligible lines).
- OVERDUE / PARTIAL invoice states are derived, not stored.
- Double billing prevented by DB unique `(subscriptionId, periodStart)`.
- Customer ↔ User: signup creates/links a Customer by email; staff-created customers can later sign up and get linked.
- Cross-module calls by URL (`/invoices/new?subscriptionId=`), not imports, so branches compile independently.

## Progress log
- T+0:00 Phase 0 started.
- Phase 0 code committed (`phase0` tag): typecheck, lint, build all green.
- Neon migrated (`init`), seeded; admin login → dashboard verified in browser.
- Workflow change (user request): **user does all git commits**. No worktrees/branches — all sessions share one folder, separated by file ownership; each session runs its own dev server with a separate build dir (`npm run dev:a…d`) and ends each milestone with a suggested commit block.
- Phase 1 launched: A, B, C, D.

## Open requests from sessions
(none)

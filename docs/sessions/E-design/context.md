# Session E — Design system, shell & auth (UI redesign v2)

**Folder** shared `D:/odoo-hackathon` · **Dev** port 3006 (`npm run dev:e`) · **Model** Opus · **Timebox** 75 min

## Goal
Turn the plain admin template into a premium SaaS look (see `docs/DESIGN.md`). Your work lifts every page at once because all modules use your shared components — so ship the shared components FIRST, then the shell, then auth.

## You own
`src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**`, `src/components/shared/**`, `src/components/motion/**`, `src/components/shell/**`, `src/app/(auth)/**` (UI only; keep `actions.ts` logic), `src/app/(app)/layout.tsx`, `src/app/portal/layout.tsx`, `src/app/portal/portal-nav.tsx`, `src/app/forbidden/**`, `src/app/(app)/search/**`

## Build order (suggested commit after each)
1. **Tokens** in globals.css (DESIGN.md §2) incl. dark mode + utilities (`bg-brand-gradient`, `text-brand-gradient`, `shadow-card`, `card-hover`, `bg-grid`); ThemeProvider (next-themes, class strategy) in root layout. Restyle shadcn `button` (primary = brand gradient, subtle inner highlight), `input`, `select`, `tabs`, `dialog`, `sheet` radii/shadows.
2. **Shared components** (DESIGN.md §3): restyle existing ones WITHOUT breaking props; add `KpiCard`, `ChartCard`, `charts.tsx` (AreaTrend, BarTrend, Donut, Sparkline — recharts, client), `AvatarName`, `MetricStrip`, `Timeline`, `Stepper`; `EmptyState` gets optional `icon`. **As soon as these exist, message Main** ("E: shared components ready") so module sessions can adopt them.
3. **Shell**: dark ink sidebar (gradient logo mark, grouped nav, active gradient bar, user card at bottom, collapsible), top bar (breadcrumb, ⌘K command palette using shadcn `command` + `/search?q=` route handler returning customers/subscriptions/invoices top 5 each, theme toggle, user menu). Keep the mobile Sheet nav. Keep Sign out as `onSelect={() => void logoutAction()}`.
4. **Auth pages**: split screen; right panel = brand gradient + `bg-grid` + 3 floating preview cards (MRR KPI with sparkline, "Invoice INV/2026/00042 · Paid" chip, mini area chart) with a slow GSAP float; left = form with logo, heading, subtle trust line. Keep all fields/names/actions unchanged.
5. **Portal layout** + **forbidden** page in the same language.

## Test (you must)
`npm run dev:e` → log in as each role (CLAUDE.md logins) and check login/signup/forgot, dashboard shell, a list page, portal at 1440×900 and 375×812, light + dark. No layout breaks in pages owned by other sessions caused by your component changes (open /subscriptions, /invoices, /products, /dashboard, /portal).

## Requests to Main
(none yet)

## Status
- [x] 1 Tokens + ThemeProvider + button/input/select/dialog restyle
- [x] 2 Shared components (KpiCard, ChartCard, charts, AvatarName, MetricStrip, Timeline, Stepper, EmptyState icon) — Main notified
- [x] 3 Shell: ink sidebar (collapsible, user card), topbar breadcrumb, ⌘K palette + `/search` route, theme toggle
- [x] 4 Auth split screen with floating GSAP preview cards (`Float` in motion)
- [x] 5 Portal ink header + forbidden page
- Tested: /subscriptions (staff) 1440 + 375, light + dark, mobile sheet, ⌘K search "kiran"; /login; /portal (customer) 375 dark + 1100 light. Ctrl+K hotkey not verifiable in the pane (button click works).
- [x] v3 "Ember Loop": motion primitives (RevealText, ScrambleNumber, Orbit, Ticker, Magnetic, FlipIndicator, DrawIn), v2 purge, shell, shared components, portal, forbidden — see prompt.md
- Note: `.claude/launch.json` got a `dev-e` entry (needed for preview).

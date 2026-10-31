# Brightloop Design System v2 — "Premium SaaS"

Goal: judges should think "this is a real funded product" (Linear / Stripe / Vercel tier) within 3 seconds.
Replaces the old "monochrome only" rule. Every session follows THIS file. Tokens and shared components are owned by **Session E**; module sessions use them, never fork them.

## 1. Look & feel
- **Dark ink sidebar** (near-black with a faint violet glow at top) + **soft light canvas** for content. Optional dark mode for the whole app (toggle in top bar) — so only use tokens, never hard-coded colours.
- **One brand gradient**: violet → indigo (`--brand-from: #7C3AED`, `--brand-to: #4F46E5`). Used for: logo mark, primary buttons, active nav indicator, key chart series, hero highlights. Never for large background areas except the auth panel and dashboard hero.
- **Depth**: cards `rounded-2xl`, white, `ring-1 ring-black/5` (dark: `ring-white/10`), layered soft shadow (`shadow-card` token). Hover on clickable cards: lift 2px + stronger shadow (CSS transition, 150ms).
- **Typography**: Inter. Page title 28px/600 tracking-tight; section title 15px/600; eyebrow labels 11px uppercase tracking-wider muted; numbers `tabular-nums`. Big KPI numbers 30px/600.
- **Colour use**: neutral greys for UI; status colours ONLY via `StatusBadge` (soft tinted pill + dot: emerald=success, amber=warning, sky=info, rose=danger, zinc=neutral — muted 10% tints, never saturated blocks). Charts use the chart palette below. No random Tailwind colours in pages.
- **Density**: generous spacing (`space-y-8` between page sections, `gap-6` grids), rows 52px.

## 2. Tokens (globals.css — Session E)
`--brand`, `--brand-from`, `--brand-to`, `--brand-soft`, `--sidebar*` (dark ink even in light mode), `--canvas` (#F7F7FB light / zinc-950 dark), `--card`, `--ring-subtle`, `--shadow-card`, `--shadow-card-hover`, status tints `--success|warning|info|danger(-soft)`, chart palette `--chart-1..6`: violet #7C3AED, indigo #4F46E5, sky #0EA5E9, emerald #10B981, amber #F59E0B, rose #F43F5E.
Utility classes: `bg-brand-gradient`, `text-brand-gradient` (gradient text), `shadow-card`, `card-hover`, `bg-grid` (faint grid texture for hero areas).

## 3. Shared components (Session E — keep existing props working, add these)
| Component | Props | Notes |
|---|---|---|
| `PageHeader` | `title, description?, actions?, eyebrow?, icon?` | eyebrow = small breadcrumb-like label |
| `KpiCard` (in `stat-card.tsx`) | `label, value: ReactNode, icon: LucideIcon, delta?: number (%), deltaLabel?, trend?: number[], tone?: "brand"|"success"|"warning"|"danger"|"info"` | gradient-tinted icon tile, delta chip (▲ +12% green / ▼ red), tiny sparkline from `trend` |
| `StatCard` | unchanged props | restyled to match KpiCard |
| `ChartCard` | `title, description?, actions?, children, className?` | card wrapper for charts |
| `charts.tsx` (client) | `AreaTrend({data, xKey, yKey, format?})`, `BarTrend({data, xKey, bars:[{key,label}]})`, `Donut({data:[{name,value,color?}], centerLabel?, centerValue?})`, `Sparkline({data})` | Recharts, gradient fills, themed tooltips, `ResponsiveContainer`, no animation > 600ms |
| `AvatarName` | `name, sub?, size?` | initials avatar (colour from name hash, chart palette) + name + muted sub line — use for customers/users in tables |
| `StatusBadge` | unchanged | soft tinted pill + dot |
| `DataTable` | unchanged | rounded-2xl card, sticky header, 52px rows, hover row, nicer empty state |
| `EmptyState` | `title, description?, action?, icon?` | icon in gradient ring |
| `Section` | unchanged | rounded-2xl card |
| `FilterTabs` | unchanged | pill segmented control |
| `MetricStrip` | `items: {label, value, hint?}[]` | horizontal summary bar above tables (count / total / outstanding) |
| `Timeline` | `items: {title, description?, time, icon?, tone?}[]` | vertical activity timeline |
| `Stepper` | `steps: string[], current: number, side?: string` | lifecycle progress (subscriptions) |

Shell (Session E): dark sidebar with gradient logo mark, grouped nav, active item = soft white/10 pill + gradient left bar, collapsible on desktop, sheet on mobile; user card at sidebar bottom. Top bar: breadcrumb, **⌘K command palette** (search customers, subscriptions by number, invoices by number + jump to any page), theme toggle, user menu. Auth pages: split screen — form left; right = dark brand-gradient panel with floating product preview cards (KPI card, mini chart, invoice chip) gently animated with GSAP. Portal: same visual language, top nav.

## 4. Page patterns (module sessions)
- **List pages**: PageHeader (eyebrow + icon) → MetricStrip (2–4 aggregate numbers for current filter) → Toolbar (search + FilterTabs) → DataTable (first column = AvatarName or bold number + muted sub-line) → Pagination.
- **Detail pages**: hero card (title, StatusBadge, key facts, primary actions) → 2/3 + 1/3 grid: main Sections left, side card(s) right (customer card, totals, timeline).
- **Forms**: card sections with titles + helper text, 2-col grid, sticky bottom action bar (Cancel / Save) on long forms, live summary panel on the right where totals exist.
- **Catalog**: plans as pricing cards grid (price big, period, flags as chips) with a list/grid toggle; products with variant chips.
- Use GSAP only via `@/components/motion` (FadeIn, Stagger, CountUp, Pulse).

## 5. Quality bar & testing (every session)
- Test your pages in the browser at **1440×900 and 375×812**, light and dark (once the toggle exists), as the relevant role. No horizontal page scroll, no overlapping text, no raw unstyled elements.
- Performance stays: list pages < 1 s on seeded data; charts load only on pages that use them.
- `npm run typecheck` + `npm run lint` clean.

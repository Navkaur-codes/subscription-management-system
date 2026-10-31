# Brightloop Design System v3 — "Ember Loop"

**Why v3:** v2 (violet→indigo gradient, glassy floating cards, rounded-2xl everything) reads as a generic AI-generated SaaS template. v3 is a real brand: editorial, warm, confident, with one signature motif and purposeful motion. Every session follows THIS file. If a v2 rule conflicts, v3 wins.

## 1. Identity
- **Name story:** Brightloop = recurring revenue = *the loop*. Signature visual: an **orbit ring** (thin ink circle) with **ember dots travelling around it** — each dot is a payment coming back every cycle. Used on login, dashboard hero, logo, empty states, loading.
- **Palette (tokens already in globals.css):** paper `#F6F4EF` canvas, ink `#16140F`, card `#FFFDF9`, warm greys, **ember `#FF5B1F`** as the ONLY accent (sparingly: active nav, key number, focus ring, one chart series, small highlights). Dark mode = ink canvas, paper text, same ember.
  - Tailwind: `bg-canvas`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary` (ink in light, paper in dark), `text-ember`, `bg-ember`, `bg-ember-soft`, `bg-ink`, `bg-paper`, `border-border`.
  - **Banned:** purple/violet/indigo anything, `bg-brand-gradient` on large areas, glassmorphism (`backdrop-blur` on cards), glow shadows (`rgb(124 58 237 …)`), gradient text, emoji.
- **Type:**
  - Display: **Instrument Serif** (`font-display`), used for page titles, hero headlines, big KPI numbers on the dashboard hero. Put the key word in italics: `<h1 className="font-display text-5xl">Revenue that <em>comes back</em>.</h1>`.
  - UI: **Geist** (default `font-sans`). Labels 12–13px, medium.
  - Numbers / IDs: **Geist Mono** (`font-mono-num`) for invoice + subscription numbers and money columns.
- **Shape:** radius 10px (`rounded-lg`/`rounded-xl` max on cards), hairline borders first, shadows almost none (`shadow-card` is a 1px hairline lift). Use **ruled lines** (border-t/border-b dividers, editorial grid) instead of floating boxes where possible.
- **Status pills:** keep `<StatusBadge>` (soft tint + dot); tokens already warm-tuned.

## 2. Motion (GSAP 3.15 — SplitText, ScrambleText, DrawSVG, MotionPath, Flip are installed & free)
All motion lives in `@/components/motion` (Session E builds these; pages never import gsap directly). Respect `prefers-reduced-motion`. Animate transform/opacity/stroke only. Durations 0.4–0.9s, `power3.out` / `expo.out`. Each page: ONE orchestrated entrance, not everything bouncing.

| Primitive | What it does | Where |
|---|---|---|
| `<RevealText as="h1">` | SplitText lines/words slide up from a mask, 0.05s stagger | page titles, hero headlines |
| `<ScrambleNumber value format>` | ScrambleText digits → final value | KPI numbers, invoice totals |
| `<DrawLine>` / chart prop `animate` | DrawSVG stroke draw-in of chart lines | AreaTrend / Sparkline |
| `<Orbit size dots speed>` | SVG loop ring + ember dots on MotionPath, infinite slow rotation (paused off-screen) | login, dashboard hero, empty states, logo mark |
| `<Ticker items>` | horizontal marquee of live events ("INV/2026/12931 paid · ₹31,947 · UPI") | dashboard hero, login |
| `<Magnetic>` | button follows cursor slightly on hover | primary CTAs only |
| `<FlipIndicator>` / Flip | active pill glides between items | sidebar nav, FilterTabs, segmented controls |
| `<Stagger>` (existing) | list/card entrance | grids, first 12 table rows |
| `<CountUp>` (existing) | keep for small numbers | |

## 3. Layout patterns
- **Page header:** small mono eyebrow (e.g. `SALES / 02`), serif title with italic accent word, one-line description, actions right. Ruled line under the header.
- **Dashboard hero:** ink card (dark in both themes) — left: serif headline ("₹9.12 Cr *recurring*, up 22.6%"), sub-copy, actions; right: `<Orbit>` with live dots; bottom: `<Ticker>` of latest payments/invoices.
- **KPI row:** borderless cells separated by vertical rules on one card (not 5 floating cards); label, mono/serif number with ScrambleNumber, delta, sparkline.
- **Tables:** hairline rows, mono numbers, AvatarName for people, ember dot for "new today".
- **Login:** see Main's implementation (`src/app/(auth)`) — the reference for tone.

## 4. Ownership for v3
- **Main:** `globals.css` tokens, `src/app/layout.tsx` fonts, `src/app/(auth)/**` (login/signup/forgot/reset), `docs/DESIGN.md`.
- **E:** motion primitives (§2), shell (sidebar Flip indicator, logo with orbit mark, topbar), shared components restyle to v3, purge v2 violet/glow/glass from shared code, portal layout, forbidden page.
- **D:** dashboard hero + KPI row + charts with draw-in, reports, customers, portal pages.
- **A / B / C:** their pages: serif titles via PageHeader, mono numbers, purge hard-coded v2 colours/glows, one signature moment each (A: plan cards hover reveal; B: lifecycle stepper animated with Flip; C: invoice total ScrambleNumber + payment progress draw).

## 5. Quality bar
Test at 1440×900 and 375×812, light + dark. No v2 leftovers (`grep -rn "124 58 237\|7c3aed\|violet\|indigo" src`). typecheck + lint clean. Page JS stays light: GSAP plugins registered once in motion/index.

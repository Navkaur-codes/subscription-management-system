# Session E — prompt log

## v2 "Premium SaaS" (initial)
Tokens, shared components, shell + ⌘K + theme toggle, auth split screen, portal layout, forbidden page. Done; see context.md Status.

## Follow-up: v2 DataTable row click (from Session C)
Overlay row link sat under the `relative` cell span → only gaps navigated. Fixed: link z-10, no wrapper span, in-cell controls z-20, header z-30.

## Follow-up: v3 "Ember Loop" (from Main)
User found v2 AI-generic. Read the rewritten `docs/DESIGN.md`. Main owns globals.css, root layout, `(auth)/**` now.
1. Motion primitives in `src/components/motion` (plugins registered once in `gsap.ts`): RevealText, ScrambleNumber (+formatNumber), Orbit, Ticker, Magnetic, FlipIndicator, DrawIn. Message Main with signatures.
2. Purge v2 (violet/indigo/glow/gradient fills/glass) from E files; primary button = ink with ember edge on hover.
3. Shell: orbit logo mark, sidebar ember dot + Flip-gliding indicator, mono group labels, hairline topbar, warm ⌘K.
4. Shared: PageHeader (mono eyebrow, RevealText serif title, ReactNode title with <em>, ruled line), KpiCard (`numeric` → ScrambleNumber, serif number) + KpiStrip, charts (ember/ink, DrawSVG draw-in), DataTable hairline + mono numbers, EmptyState with Orbit, FilterTabs Flip.
5. Portal ink header + Flip underline; forbidden page with Orbit + serif.

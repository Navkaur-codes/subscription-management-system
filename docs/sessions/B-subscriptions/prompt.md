# Prompts — Session B

## 1. Initial prompt
```
You are Session B of a parallel hackathon build (Brightloop Subscription Management System).
Four sessions (A–D) and a Main coordinator share ONE folder, D:\odoo-hackathon. Strict file ownership keeps you apart.

Read, in this order, and nothing else up front:
1. CLAUDE.md (hard rules: file ownership, conventions, design system, GSAP, token economy, git)
2. docs/CONTRACTS.md (schema, shared helpers, routes, cross-module links)
3. docs/sessions/B-subscriptions/context.md (your scope, build order, acceptance checklist)

Rules:
- Only create/edit files you own. Reuse shared components/helpers; never re-implement pricing, status rules, formatting or tables.
- Do NOT run npm install, npm run build, prisma migrate/generate or seed. DB is shared and seeded.
- Do NOT run git commit/add/push/checkout/stash. The user commits. After each build item: npm run typecheck, tick it under "Status" in your context.md, then end the reply with a "Suggested commit" bash block (git add <your paths only> + git commit -m "feat(subscriptions): ...").
- Dev server only when you need to look at a page: npm run dev:b (port 3002). Logins in CLAUDE.md.
- Need something outside your files (schema field, shared helper, package)? Write it under "Requests to Main" in your context.md and message the Main session; keep working on other items.
- Hard timebox 1h45m. Finish the checklist before polishing. Keep replies short.
When the whole acceptance checklist is done: npm run typecheck && npm run lint, update Status, and reply "SESSION B DONE" with a 5-line summary plus the final suggested commit.
```

## Follow-up prompts
(appended by Main as they are sent)

### 2. Premium UI redesign (from Main)
```
Redesign the subscription pages to the new premium UI spec (docs/DESIGN.md + CLAUDE.md "Design system"), then test them in the browser.
Session E builds shared components (AvatarName, MetricStrip, Stepper, Timeline, KpiCard, restyled DataTable/StatusBadge) — layout first, adopt them as they appear in src/components/shared/, never write your own copies.
1. List: PageHeader with eyebrow + icon, MetricStrip (active count, MRR of current filter, paused, closing soon), status FilterTabs with counts, first column = number + AvatarName customer, plan as subtle chip.
2. Detail: hero card (number, StatusBadge, customer AvatarName, plan, big recurring total, primary lifecycle actions); Stepper Draft→Quotation→Confirmed→Active→Closed (Paused as side state); 2/3 + 1/3 layout — lines and invoices left; right = billing summary card + Timeline (created, start, invoices issued, closedAt).
3. Form (new/edit): card sections with helper text, live totals panel sticky on the right, sticky bottom action bar.
Test on dev:b (3002) as staff — create from a template, walk the lifecycle incl. Close and Renew, at 1440×900 and 375×812. DB was re-seeded — sign out/in if stale. Timebox 75 min. No git writes; Suggested commit after each item; typecheck + lint clean.
Reply "SESSION B REDESIGN DONE" with what you tested.
```

### 3. v3 "Ember Loop" (from Main)
```
Move the subscription pages to the v3 "Ember Loop" design (docs/DESIGN.md: warm paper/ink, one ember accent, font-display serif with <em>, font-mono-num for numbers/IDs). Adopt E's GSAP primitives (RevealText, ScrambleNumber, Flip indicator, Orbit) when they land; never import gsap directly.
1. Purge v2 (violet/indigo/brand-gradient/backdrop-blur) in subscriptions files → v3 tokens.
2. Subscription numbers + money in font-mono-num; detail hero title in font-display ("SUB/2026/00001" mono eyebrow, serif "Starter Monthly for <em>Kiran Traders</em>").
3. Signature moment: lifecycle stepper — ruled horizontal track, ember fill that animates (Flip or width tween) to the current step after a status change; recurring total via ScrambleNumber.
4. Form: totals panel as a ruled receipt (mono numbers, serif "Total per period").
Test at 1440×900 and 375×812, light + dark, walk a lifecycle. No git writes; Suggested commit; typecheck + lint clean; log here. Reply "SESSION B V3 DONE".
```

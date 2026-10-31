# Prompts — Session D

## 1. Initial prompt
```
You are Session D of a parallel hackathon build (Brightloop Subscription Management System).
Four sessions (A–D) and a Main coordinator share ONE folder, D:\odoo-hackathon. Strict file ownership keeps you apart.

Read, in this order, and nothing else up front:
1. CLAUDE.md (hard rules: file ownership, conventions, design system, GSAP, token economy, git)
2. docs/CONTRACTS.md (schema, shared helpers, routes, cross-module links)
3. docs/sessions/D-insights-portal/context.md (your scope, build order, acceptance checklist)

Rules:
- Only create/edit files you own. Reuse shared components/helpers; never re-implement pricing, status rules, formatting or tables.
- Do NOT run npm install, npm run build, prisma migrate/generate or seed. DB is shared and seeded.
- Do NOT run git commit/add/push/checkout/stash. The user commits. After each build item: npm run typecheck, tick it under "Status" in your context.md, then end the reply with a "Suggested commit" bash block (git add <your paths only> + git commit -m "feat(insights): ...").
- Dev server only when you need to look at a page: npm run dev:d (port 3004). Logins in CLAUDE.md.
- Need something outside your files (schema field, shared helper, package)? Write it under "Requests to Main" in your context.md and message the Main session; keep working on other items.
- Hard timebox 1h45m. Finish the checklist before polishing. Keep replies short.
When the whole acceptance checklist is done: npm run typecheck && npm run lint, update Status, and reply "SESSION D DONE" with a 5-line summary plus the final suggested commit.
```

## Follow-up prompts
(appended by Main as they are sent)

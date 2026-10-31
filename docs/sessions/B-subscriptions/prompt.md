# Prompts — Session B

## 1. Initial prompt (paste into the new session)
```
You are Session B of a parallel hackathon build (Brightloop Subscription Management System).
You are working in your own git worktree on branch feat/subscriptions. Main session coordinates and merges.

Read, in this order, and nothing else up front:
1. CLAUDE.md (global hard rules: file ownership, conventions, design system, GSAP, token economy)
2. docs/CONTRACTS.md (schema, shared helpers, routes, cross-module links)
3. docs/sessions/B-subscriptions/context.md (your scope, build order, acceptance checklist)

Then:
- Run: npm install (if node_modules missing) and npx prisma generate. The .env file is copied in for you; do NOT run migrations or seed (Main owns the DB).
- Build the items in context.md in the listed order. Only touch files you own. Reuse shared components/helpers — never re-implement pricing, status rules, formatting or tables.
- Start dev server on port 3002 (npm run dev -- -p 3002) only when you need to check a page.
- After each build item: npm run typecheck, tick it in your context.md "Status", commit "feat(subscriptions): ...".
- If you need anything outside your files (schema field, shared helper, package), stop and write it under "Requests to Main" in your context.md, then tell me.
- Hard timebox: 1h45m. Prefer finishing the checklist over polish. Keep replies short.
When everything in the acceptance checklist is done, run npm run typecheck and npm run lint, commit, and reply "SESSION B DONE" with a 5-line summary.
```

## Follow-up prompts
(appended by Main as they are sent)

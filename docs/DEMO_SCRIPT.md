# Brightloop — Demo Video Script & Pitch (target 6:30, hard max 7:00)

**Live app:** https://subscription-management-system-delta.vercel.app
**Repo:** https://github.com/Navkaur-codes/subscription-management-system

The video follows the problem statement's own story — *"A Month at Brightloop"* — scene by scene, so judges can tick every requirement as they watch. Every scene has: **PS scene** it proves · **SHOW** (exact clicks) · **SAY** (narration, read as written) · **CAPTION** (optional on-screen text).

---

## 0. What judges should feel

1. **"It covers the whole PS."** — every scene of *A Month at Brightloop* is shown, in order.
2. **"It actually works."** — real data (5,000 subscriptions), real email, rules that hold (no double billing, discounts auto-apply, roles enforced).
3. **"It looks like a real product."** — the animated loop, the dashboard, the polish.
4. **"They know what they built."** — one confident closing line on the engineering.

Narration pace: about 140 words per minute. Each scene's SAY block is sized to its time slot.

---

## 1. Timeline at a glance

| # | Time | Scene | PS section it proves |
|---|---|---|---|
| 1 | 0:00 – 0:35 | Hook: the problem + the loop | *How Things Run Today* |
| 2 | 0:35 – 1:15 | Sign-up, password rules, roles | *A new customer signs up* |
| 3 | 1:15 – 2:00 | Products, variants, plans, discounts | *Launching a new plan* · *A customer asks for a better price* |
| 4 | 2:00 – 2:55 | Template → subscription → lifecycle | *Turning a quote into a subscription* |
| 5 | 2:55 – 3:55 | Invoice with auto discount + billing run | *Billing day* · *A customer asks for a better price* |
| 6 | 3:55 – 4:35 | Partial → full payment | *The money comes in* |
| 7 | 4:35 – 5:25 | Dashboard, reports, CSV, speed | *The finance lead, at the end of the month* |
| 8 | 5:25 – 6:10 | Customer portal + password reset email | *customers … manage their own subscriptions* · *reset link* |
| 9 | 6:10 – 6:40 | Under the hood + closing line | — |

---

## 2. Prepare before you record (do this in order)

**Accounts & data**
1. **Right before the final take, run `npm run demo:prepare`** in the project folder (it uses the same Neon database as the live site). It adds 40 subscriptions that went live today, so *Generate due invoices* has real work to show in scene 5. If you rehearse the billing run, run it again before recording.
2. On the live site, **sign up with your own Gmail** (e.g. *Navpreet Kaur*, your Gmail address). This customer is used in scenes 4–6 so the invoice email lands in your real inbox, and in scene 8 for the password reset.
3. Make sure Vercel has your Gmail `SMTP_*` variables set, or emails will go to the test inbox.
4. Avoid `npm run seed:bulk` from now on — it wipes everything, including your Gmail account (you'd have to sign up again).

**Browser**
5. Use Chrome or Edge at **1920×1080**, zoom **100%**, bookmarks bar hidden (Ctrl+Shift+B), only two tabs: the app and your **Gmail inbox**. Pick **light mode** with the sun/moon button in the app's top bar (the choice is remembered).
6. Turn on **Focus assist / Do not disturb** so no notifications appear.
7. **Warm up the site:** sign in and click every sidebar page once, then sign out. The first load after the database has been idle can take 1–2 s.
8. End on `/login`, signed out.

**Numbers you will see** (from the seeded catalog — good to know so you can say them confidently)
- Brightloop CRM: ₹1,200 · **Odoo variant +₹560 → ₹1,760 per seat**
- Template *Enterprise CRM bundle*: 25 × CRM (Odoo) + 25 × Analytics + 1 × Priority support = **₹57,750** before discount
- Discount *Bulk seats 10%* applies automatically at 10+ seats → **₹5,775 off**, tax on the discounted amount → total **₹61,330.50**
- For payments: pay **₹30,000** first, then **₹31,330.50**

---

## 3. The script

### Scene 1 — Hook: the problem and the loop · 0:00 – 0:35
**PS:** *How Things Run Today*

**SHOW**
1. Start on the sign-in page. Do nothing for 3 seconds — let the loop draw in and the payment dot travel round the stations.
2. Move the mouse slowly over the dark panel so it tilts.

**SAY**
> "Brightloop Software earns its money every month — but today, subscriptions live in a spreadsheet, renewals are remembered by whoever notices first, invoices are typed by hand, and payments are matched by scrolling bank statements. Nobody can say how much recurring revenue the company actually has.
> So we built Brightloop: one platform for the full life of a subscription. The loop on screen *is* the product — a plan becomes a subscription, the subscription produces invoices, and invoices turn into payments. Every single cycle."

**CAPTION:** *Brightloop — subscriptions, billing & revenue in one loop*

---

### Scene 2 — Sign-up, security and roles · 0:35 – 1:15
**PS:** *A new customer signs up*

**SHOW**
1. Click **Create an account**. Type name *Test User*, any email, password `password1`, confirm it → **Create account** → the error *"Password needs an uppercase letter"* appears.
2. Click **Sign in** to go back. Point at the three **Admin / Staff / Customer** buttons.
3. Click **Admin**. In the sidebar open **Team members** → click **Add staff member** to show the form (no need to save) → close it.

**SAY**
> "A new customer signs up with their email. Each email can belong to only one account, and the password must be more than eight characters, with an uppercase letter, a lowercase letter and a special character — exactly as the brief asks.
> There are three roles. The admin controls the whole system, staff handle day-to-day work with limited access, and customers only ever see their own subscriptions and invoices. And only the admin can add a new member of staff."

**CAPTION:** *Unique email · strong passwords · 3 roles enforced on every action*

---

### Scene 3 — Launching a new plan · 1:15 – 2:00
**PS:** *Launching a new plan* · *A customer asks for a better price* (admin-only discounts)

**SHOW**
1. Sidebar → **Products** → open **Brightloop CRM**. Point at sales price, cost price, the tax, and the variant **Brand: Odoo +₹560**.
2. Sidebar → **Plans**. Let the pricing cards animate. Point at a card's period, minimum quantity and the rule chips (*Pausable, Renewable, Auto-close*).
3. Sidebar → **Discounts**. Point at *Bulk seats 10%* — the sentence, the minimum of 10 seats, and the usage bar.

**SAY**
> "Launching a product: the admin sets its name, type, sales and cost price, taxes and notes — and variants. Choosing the Odoo brand adds 560 rupees to the price.
> Then the plan: its price and how often it bills — daily, weekly, monthly or yearly — the minimum quantity and the dates it's available. Plan by plan, the admin decides whether it closes on its own, and whether it can be paused, renewed, or closed early.
> Discounts are admin-only: fixed or percentage, with a minimum purchase or quantity, start and end dates, and a usage limit."

**CAPTION:** *Variants · billing periods · per-plan rules · admin-only discounts*

---

### Scene 4 — From quotation to active subscription · 2:00 – 2:55
**PS:** *Turning a quote into a subscription*

**SHOW**
1. Sidebar → **Quotation templates** → open **Enterprise CRM bundle** → click **Use template**.
2. The form opens pre-filled (plan *Business Yearly*, the Odoo line, ₹57,750 subtotal). Choose **your Gmail customer** in the customer picker (type a few letters of your name). The totals panel shows ₹68,145 per period — the bulk discount is added on the invoice in scene 5.
3. Click **Create subscription**. Point at the new number **SUB/2026/…**, the dates and payment terms.
4. Click **Send quotation** → **Confirm** → **Activate**. Pause a moment after each click so the stepper visibly moves.

**SAY**
> "A sales rep preparing an offer for a large customer doesn't start from scratch. They pick a quotation template that already has the right plan and product lines, and stays valid for a set number of days.
> One click, and the subscription exists — with its own number, a customer, a plan, a start and expiry date, payment terms, and lines showing product, quantity, unit price, taxes and amount.
> It moves from Draft, to Quotation, to Confirmed, to Active — and anyone on the team can see exactly where it stands."

**CAPTION:** *Draft → Quotation → Confirmed → Active*

---

### Scene 5 — Billing day · 2:55 – 3:55
**PS:** *Billing day* · *A customer asks for a better price* (discount appears on its own)

**SHOW**
1. On the active subscription click **Create invoice**. Point at the **Discount** column (−₹5,775) and the tax line; total **₹61,330.50**.
2. Click **Confirm**, then **Send** (the email goes to your Gmail), then **Print** and close the print dialog.
3. Sidebar → **Invoices** → **Generate due invoices**. The preview reads *"40 subscriptions are due today … Estimated to bill ₹…"* with how many get an auto-discount. Pause on it, then click **Create 40 invoices** → wait for the toast *"40 invoices created"*.
4. Click **Generate due invoices** again → the preview now says *"You're all caught up"*. Close it.

**SAY**
> "It's billing day, and hundreds of subscriptions are due at once. Nobody types an invoice. Each one is created from its subscription, with customer details, product lines, taxes and totals already filled in.
> Notice the discount: this customer took more than ten seats, so the bulk discount appeared on its own — and tax is charged on the discounted amount. We can confirm, send by email, or print.
> For the whole company, we run billing: it previews how many invoices will be created and the total, then creates them. Open it again — and it's all caught up. Nothing is ever billed twice or skipped."

**CAPTION:** *Auto-generated invoices · discount applied automatically · never billed twice*

---

### Scene 6 — The money comes in · 3:55 – 4:35
**PS:** *The money comes in*

**SHOW**
1. Open the invoice you created → **Register payment** → amount **30000**, method **Bank transfer** (already selected), add a note → **Record payment**. Wait a second for the page to refresh, then point at the **Partial** badge and *Amount due ₹31,330.50*.
2. **Register payment** again → **31330.50**, method **UPI** → **Record payment** → toast *"Payment recorded — invoice paid"*, badge turns **Paid**, *Register payment* disappears.
3. Sidebar → **Payments**. Point at *Collected this month* and the split by method.

**SAY**
> "Payments arrive by different methods and on different days. Each is recorded against the right invoice — method, amount, date and a note.
> Part-paid invoices show as partial. When the balance is cleared, the invoice moves to Paid automatically, and overpaying is blocked. At any moment the team can see what's paid and what's still outstanding — so overdue invoices are chased before they turn into lost revenue."

**CAPTION:** *Partial → Paid automatically · every method tracked*

---

### Scene 7 — The finance lead, end of month · 4:35 – 5:25
**PS:** *The finance lead, at the end of the month*

**SHOW**
1. Sidebar → **Dashboard**. **Stop for 3 seconds** — let the numbers scramble in and the MRR line draw.
2. Slowly scroll: KPI strip → recurring revenue chart → subscriptions by status → overdue invoices → recent payments.
3. Sidebar → **Reports** → switch to **Invoices** → pick a status filter → click **Export CSV**.

**SAY**
> "End of the month, and the finance lead's questions — how many subscriptions are active, how much came in, how much is still owed, which invoices are overdue — used to take days. Now they're one screen.
> Active subscriptions, recurring revenue with its twelve-month trend, collections and outstanding — each with the change from last month. Reports filter subscriptions, invoices and payments, show summary totals, and export to CSV.
> This database holds five thousand subscriptions and over ten thousand invoices — and every page still responds well under two seconds."

**CAPTION:** *5,000 subscriptions · every page < 2 s*

---

### Scene 8 — Customer self-service & password reset · 5:25 – 6:10
**PS:** *customers want to see and manage their own subscriptions* · *reset link at their registered email*

**SHOW**
1. Sign out (icon at the bottom of the sidebar). On the sign-in page click the **Customer** demo button (Kiran Traders).
2. Portal → **Subscriptions** → open **SUB/2026/00001 · Starter Monthly** → **Pause** → **Continue** → status *Paused* → **Resume** → *Active*.
   (Use this one: your Gmail customer's *Business Yearly* plan doesn't allow pausing, so it shows no Pause button — which is the plan rule working.)
3. Portal → **Invoices** → open an invoice → **Print** (close the dialog).
4. Sign out from the **avatar menu at the top right** (the portal has no sidebar) → **Forgot password?** → enter your Gmail → **Send reset link**.
5. Switch to the **Gmail tab** → open the Brightloop email → click **Reset password** → set a new password → sign in.

**SAY**
> "Customers manage their own subscriptions without emailing anyone. They see their plans and invoices, print an invoice, and pause or resume when the plan allows — and they can never see another customer's data.
> And if they forget their password, a reset link arrives at their registered email in seconds — here it is, in a real inbox."

**CAPTION:** *Self-service portal · real email delivery*

---

### Scene 9 — Under the hood & close · 6:10 – 6:40
**SHOW**
1. Go back to the **Dashboard** (or the sign-in loop) and leave it on screen.
2. Optional: a 3-second cut to the GitHub README or to the terminal showing `npm run verify` → *35 passed, 0 failed*.

**SAY**
> "Under the hood: Next.js, PostgreSQL and Prisma. One pricing engine shared by subscriptions and invoices, so totals always match. Double billing is prevented by the database itself. Every action checks the user's role. And an automated test verifies thirty-five business rules from this brief, end to end.
> Brightloop — revenue that comes back, every single cycle. Thank you."

**CAPTION:** *Next.js · PostgreSQL · Prisma · 35/35 business-rule tests passing*

---

## 4. Recording & editing

**Easiest: Clipchamp (built into Windows 11, free)**
1. Start → **Clipchamp** → **Create a new video**.
2. **Record & create → Screen** — record each scene separately (redo any scene that goes wrong).
3. Voice: either **Record & create → Text to speech** (paste each SAY block, pick a natural voice, save, place under its scene) or record your own voice with **Record & create → Audio**.
4. Add CAPTIONs with **Text** (bottom-left, small, 3–4 s each).
5. **Export → 1080p**. Check the length is ≤ 7:00.

**Alternatives:** OBS Studio (free, best quality) or **Win + Alt + R** (Xbox Game Bar) to record, then edit in Clipchamp.

**Tips**
- Your own voice usually lands better with judges than a synthetic one — speak slower than feels natural.
- Move the mouse calmly; pause on every "wow" moment (loop, stepper, dashboard, Paid badge, the email arriving).
- Trim dead time (page loads, typing) in the editor — the target is 6:30.
- Background music: very low, or none.

---

## 5. If something goes wrong while recording

| Problem | Fix |
|---|---|
| Page slow on first click | It's the database waking up — warm up first (section 2, step 7) and re-record that scene |
| Billing preview says "You're all caught up" on the first try | Billing already ran during rehearsal — run `npm run demo:prepare` and record scene 5 again |
| Badge still shows the old status right after a click | Wait a second — the page refreshes from the server; don't click twice |
| Reset email not in inbox | Check Spam once and mark *Not spam*; confirm the Vercel `SMTP_*` variables; or show the scene with the test-inbox preview link and say "routed to a test inbox in this environment" |
| Discount not applied | Total quantity must be 10+ seats — the *Enterprise CRM bundle* template already has 51 |
| Signed in as the wrong role | Sidebar → sign-out icon (bottom) → pick the right demo button |

---

## 6. Submission checklist

- [ ] Video ≤ 7:00, 1080p, audio clear, every PS scene shown
- [ ] Video description has the **live link** and the **GitHub link**
- [ ] README is up to date (demo logins, walkthrough, setup)
- [ ] Latest code pushed; Vercel deployment shows `sin1` in the `x-vercel-id` header
- [ ] Live site warmed up shortly before judges are likely to open it

---

## 7. Likely judge questions (for the offline round)

- **"How do you stop double billing?"** — A unique database constraint on *(subscription, billing period)*; a duplicate attempt is caught and treated as "already billed", so even two simultaneous billing runs can't bill twice.
- **"How do discounts stay within their usage limit?"** — The usage counter is incremented with a conditional update inside the invoice transaction, so parallel billing can't overshoot it.
- **"How does it scale?"** — Server-side pagination everywhere, indexes on status / customer / dates, aggregate SQL for the dashboard, and functions deployed next to the database. Tested with 5,000 subscriptions.
- **"How are roles enforced?"** — Middleware redirects by role, every page checks it, and every server action checks it again; portal queries are always scoped to the signed-in customer.
- **"How do you know it's correct?"** — `npm run verify` runs 35 business-rule checks from the problem statement against the real code and database, and cleans up after itself.

# Brightloop — Demo Video Script (5:00 – 5:30)

**Live app:** https://subscription-management-system-delta.vercel.app
**Repo:** https://github.com/Navkaur-codes/subscription-management-system

The video follows the problem statement's story, *"A Month at Brightloop"*, in order. For each scene: **SHOW** = what to click, **SAY** = what to read (about 140 words per minute). Every step below was clicked through on the real app.

---

## Timeline

| # | Time | Scene | PS section |
|---|---|---|---|
| 1 | 0:00 – 0:25 | Hook: the problem + the loop | How things run today |
| 2 | 0:25 – 0:55 | Sign-up rules & roles | A new customer signs up |
| 3 | 0:55 – 1:35 | Products, variants, plans, discounts | Launching a new plan · Better price |
| 4 | 1:35 – 2:20 | Template → subscription → lifecycle | Turning a quote into a subscription |
| 5 | 2:20 – 3:15 | Invoice with auto-discount + billing run | Billing day |
| 6 | 3:15 – 3:50 | Partial → full payment | The money comes in |
| 7 | 3:50 – 4:30 | Dashboard, reports, CSV | The finance lead |
| 8 | 4:30 – 5:05 | Customer portal + password reset | Customers self-serve |
| 9 | 5:05 – 5:20 | Close | — |

---

## Before you record (10 minutes)

1. In the project folder run **`npm run demo:prepare`** — adds 40 subscriptions that went live today, so the billing run in scene 5 has real work to show. Run it again if you rehearse scene 5.
2. On the live site, **sign up with your own Gmail** (your name, real Gmail). You'll use this customer in scenes 4–6, and its inbox in scene 8.
3. Browser: Chrome/Edge, 1920×1080, zoom 100%, bookmarks bar hidden (Ctrl+Shift+B), **light mode** (sun/moon button in the app's top bar). Only two tabs: the app and your **Gmail inbox**. Turn on Do-not-disturb.
4. **Warm up:** sign in, click every sidebar page once, sign out. (The free database is slow on the very first load after being idle.)
5. Start the recording on **/login**, signed out.

Numbers you'll see: Odoo variant **+₹560 → ₹1,760/seat** · template subtotal **₹57,750** · discount **−₹5,775** · tax **₹9,355.50** · total **₹61,330.50** · payments **₹30,000** then **₹31,330.50**.

---

## Scene 1 — The problem and the loop · 0:00 – 0:25

**SHOW**
1. Sign-in page. Let the loop animation play for 3 seconds (the ember dot travels Plan → Subscription → Invoice → Payment).
2. Move the mouse slowly over the dark panel so it tilts.

**SAY**
> "Brightloop Software earns its money every month — yet its subscriptions live in a spreadsheet, invoices are typed by hand, and nobody can say how much recurring revenue it really has. Brightloop is our answer: one platform for the whole loop — a plan becomes a subscription, the subscription becomes invoices, and invoices become payments. Every cycle."

---

## Scene 2 — Sign-up and roles · 0:25 – 0:55

**SHOW**
1. Click **Create an account** → name `Test User`, any email, password `password1` (both fields) → **Create account** → error *"Password needs an uppercase letter"*.
2. Click **Sign in** → point at the **Admin / Staff / Customer** buttons → click **Admin**.
3. Sidebar → **Team members** → **Add staff member** (show the form) → press **Esc**.

**SAY**
> "Each email can hold only one account, and passwords must be more than eight characters with upper case, lower case and a special character — exactly as the brief asks. There are three roles: the admin controls everything, staff handle daily work with limited access, and customers see only their own data. Only the admin can add staff."

---

## Scene 3 — Launching a product and plan · 0:55 – 1:35

**SHOW**
1. Sidebar → **Products** → open **Brightloop CRM** → point at sales price ₹1,200, cost ₹300, GST 18% and the variant **Brand: Odoo +₹560**.
2. Sidebar → **Plans** → let the cards animate → point at a card's period, minimum quantity and the chips *Pausable · Renewable · Auto-close*.
3. Sidebar → **Discounts** → point at **Bulk seats 10%** — *"10% off subscriptions with 10+ units"* and its usage meter.

**SAY**
> "Products carry a sales price, cost price, taxes and variants — choosing the Odoo brand adds 560 rupees. Plans set the price, the billing period — daily to yearly — a minimum quantity and availability dates, and each plan decides whether it can be paused, renewed or closed early, or closes on its own. Discounts are admin-only: fixed or percentage, with minimums, dates and a usage limit."

---

## Scene 4 — Quote to subscription · 1:35 – 2:20

**SHOW**
1. Sidebar → **Quotation templates** → **Enterprise CRM bundle** → **Use template**.
2. In the customer picker type your name → select your Gmail customer. Point at the pre-filled lines.
3. **Create subscription** → point at the number **SUB/2026/…**, dates and payment terms.
4. Click **Send quotation** → **Confirm** → **Activate** — pause a second after each so the stepper moves.

**SAY**
> "A sales rep starts from a quotation template that already has the plan and product lines, valid for a set number of days. One click creates the subscription — its own number, customer, dates, payment terms and lines with quantity, price and tax. It moves from Draft to Quotation, Confirmed and Active, and the whole team can see where it stands."

---

## Scene 5 — Billing day · 2:20 – 3:15

**SHOW**
1. On the active subscription click **Create invoice** → point at **Discount −₹5,775** and the total **₹61,330.50**.
2. Click **Confirm** → **Send** (it goes to your Gmail) → **Print** → close the print dialog.
3. Sidebar → **Invoices** → **Generate due invoices** → pause on *"40 subscriptions are due today … Estimated to bill ₹…"* → click **Create 40 invoices** → toast *"40 invoices created"*.
4. Click **Generate due invoices** again → *"You're all caught up"* → close.

**SAY**
> "On billing day nobody types invoices. Each one is built from its subscription — customer, lines, taxes and totals filled in. This customer took more than ten seats, so the bulk discount applied by itself, and tax is charged on the discounted amount. We can confirm, email or print it. For everyone due today, one billing run previews the count and total, then creates them. Run it again — all caught up. Nothing is ever billed twice."

---

## Scene 6 — The money comes in · 3:15 – 3:50

**SHOW**
1. Open the invoice from scene 5 → **Register payment** → amount **30000**, method **Bank transfer** (already selected), a short note → **Record payment** → wait a second → **Partial**, *Amount due ₹31,330.50*.
2. **Register payment** → **31330.50**, method **UPI** → **Record payment** → badge **Paid**.
3. Sidebar → **Payments** → point at *Collected this month* and the split by method.

**SAY**
> "Payments come in by different methods on different days, and each is recorded against the right invoice with its method, amount, date and note. A part-payment shows as partial; once the balance is cleared, the invoice turns Paid automatically — and overpaying is blocked."

---

## Scene 7 — The finance lead · 3:50 – 4:30

**SHOW**
1. Sidebar → **Dashboard** → hold 3 seconds while numbers and the revenue line animate.
2. Scroll slowly: KPI strip → recurring revenue chart → subscriptions by status → overdue invoices.
3. Sidebar → **Reports** → click the **Invoices** tab → **Export CSV**.

**SAY**
> "At month-end the finance lead gets every answer on one screen: active subscriptions, recurring revenue and its trend, what's collected, what's outstanding and which invoices are overdue. Reports filter subscriptions, invoices and payments and export to CSV — and with five thousand subscriptions in the database, every page still loads well under two seconds."

---

## Scene 8 — Customer portal and password reset · 4:30 – 5:05

**SHOW**
1. Sign out (icon at the bottom of the sidebar) → click the **Customer** demo button.
2. **Subscriptions** → **SUB/2026/00001 · Starter Monthly** → **Pause** → **Continue** → **Resume**.
3. **Invoices** → open one → **Print** → close.
4. Avatar menu (top right) → **Sign out** → **Forgot password?** → your Gmail → **Send reset link** → switch to the Gmail tab → open the email → **Reset password** → set a new password.

**SAY**
> "Customers manage their own subscriptions without emailing anyone — view invoices, print them, and pause or resume when their plan allows. They never see anyone else's data. And a forgotten password? The reset link lands in their real inbox in seconds."

---

## Scene 9 — Close · 5:05 – 5:20

**SHOW** — back on the dashboard (or the sign-in loop).

**SAY**
> "Built with Next.js, PostgreSQL and Prisma: one pricing engine for subscriptions and invoices, double billing blocked by the database itself, roles checked on every action, and thirty-five business rules verified by an automated test. Brightloop — revenue that comes back, every single cycle."

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Billing preview says *"You're all caught up"* the first time | Run `npm run demo:prepare`, then redo scene 5 |
| A badge still shows the old status | Wait a second for the page to refresh — don't click twice |
| First page is slow | Database waking up — warm up first, re-record the scene |
| Reset email not in inbox | Check Spam and mark *Not spam*; check Vercel `SMTP_*` variables |
| Wrong role signed in | Sign-out icon (sidebar bottom) or avatar menu (portal) → pick the right demo button |

## Recording tips
- **Clipchamp** (built into Windows 11): *Record & create → Screen*, one clip per scene, then trim and export **1080p**. Need a voice? *Record & create → Text to speech* — paste each SAY block.
- Your own voice usually lands better — speak a little slower than feels natural.
- Trim page-load waits in the editor; aim for **5:15**.
- Submit by **5:30 PM**: upload as YouTube *Unlisted* (or Google Drive, *anyone with the link*) and paste the link on the hackathon page.

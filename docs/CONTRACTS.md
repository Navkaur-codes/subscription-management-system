# Contracts (frozen after Phase 0 — Main edits only)

## Data model (prisma/schema.prisma)
| Model | Key fields |
|---|---|
| User | name, email (unique), passwordHash, role ADMIN/STAFF/CUSTOMER, isActive |
| Customer | name, email (unique), phone, company, address, city, gstin, userId? (portal login) |
| Tax | name, rate (%), isActive |
| Product | name, type SERVICE/GOODS, salesPrice, costPrice, notes, isActive; variants[], taxes[] (ProductTax join) |
| ProductVariant | productId, attribute ("Brand"), value ("Odoo"), extraPrice (560) — unique(productId, attribute, value) |
| Plan | name, price, billingPeriod DAILY/WEEKLY/MONTHLY/YEARLY, minQuantity, startDate?, endDate?, autoClose, closable, pausable, renewable, isActive |
| Discount | name, code?, type FIXED/PERCENT, value, scope PRODUCT/SUBSCRIPTION, minPurchase, minQuantity, startDate?, endDate?, usageLimit?, usedCount, isActive; products[] (DiscountProduct join, for PRODUCT scope) |
| QuotationTemplate | name, validityDays, planId, paymentTerms, notes; lines[] (productId, variantId?, quantity) |
| Subscription | number (SUB/2026/00001), customerId, planId, status, startDate, expiryDate?, quotationExpiry?, nextInvoiceDate?, paymentTerms (days), discountId?, notes, createdById?, closedAt? |
| SubscriptionLine | productId, variantId?, description?, quantity, unitPrice (= product + variant extra), taxRate (% snapshot), amount (= qty×unit, pre-tax) |
| Invoice | number (INV/2026/00001), subscriptionId?, customerId, status DRAFT/CONFIRMED/PAID/CANCELLED, invoiceDate, dueDate, periodStart?, periodEnd?, discountId?, subtotal, discountTotal, taxTotal, total, amountPaid, sentAt?, paidAt? — **unique(subscriptionId, periodStart)** |
| InvoiceLine | productId, variantId?, description, quantity, unitPrice, discountAmount, taxRate, taxAmount, amount (incl. tax) |
| Payment | invoiceId, method CASH/BANK_TRANSFER/CARD/UPI/CHEQUE, amount, paymentDate, note?, reference?, recordedById? |
| Sequence | key ("SUB-2026"), value — used by nextNumber() |

## Shared functions (import, never copy)
| Import | Signature / purpose |
|---|---|
| `@/lib/db` | `db` Prisma client |
| `@/lib/auth` | `getSession()`, `requireRole(...roles)` → SessionPayload `{userId,name,email,role,customerId}`; `hashPassword(pw)` |
| `@/lib/action` | `ActionResult<T>`, `ok(data?, msg?)`, `fail(err, fieldErrors?)`, `toFail(e)`, `PAGE_SIZE`=20, `pageParams(searchParams)` → `{page, skip, take}` |
| `@/lib/pricing` | `unitPrice(salesPrice, variantExtra)`, `sumTaxRates(taxes)`, `priceLines(lines, discount?, on?)` → `{lines[{base,discountAmount,taxAmount,amount}], subtotal, discountTotal, taxTotal, total, discountApplied, discountReason}`, `discountBlockReason(d, ctx)`, type `DiscountRule` |
| `@/lib/format` | `toNum`, `round2`, `formatMoney`, `formatDate`, `formatDateTime`, `toDateInput`, `humanize` |
| `@/lib/dates` | `addPeriod(date, period, n)`, `periodRange(start, period)`, `monthlyFactor(period)`, `today()` |
| `@/lib/numbering` | `nextNumber("SUB"|"INV", tx?)` |
| `@/lib/subscription-status` | `SUBSCRIPTION_TRANSITIONS`, `transitionBlockReason(from,to,planFlags)`, `TRANSITION_LABEL`, `canRenew(status, plan)`, `LIVE_STATUSES` |
| `@/lib/invoice-status` | `INVOICE_TRANSITIONS`, `outstanding(inv)`, `isOverdue(inv)`, `displayStatus(inv)`, `overdueWhere()`, `outstandingWhere` |
| `@/lib/mail` | `sendMail({to,subject,html})` → `{ok, previewUrl?}`, `emailLayout(title, html)` |
| `@/components/shared/*` | `PageHeader`, `Section`, `DataTable`(+`Column<T>`), `EmptyState`, `StatusBadge`, `SearchInput`, `FilterTabs`, `Toolbar`, `Pagination`, `useQueryParams`, `FormField`, `FormGrid`, `StatCard`, `DetailList`, `ActionButton`, `InvoiceDocument`(+`invoiceDocumentInclude`), `PrintButton` |
| `@/components/motion` | `FadeIn`, `Stagger`, `CountUp`, `Pulse` |

### Converting a Discount row to `DiscountRule`
```ts
const rule: DiscountRule = { ...d, value: toNum(d.value), minPurchase: toNum(d.minPurchase), productIds: d.products.map(p => p.productId) };
// query with include: { products: true }
```

## Routes
| Route | Owner | Notes |
|---|---|---|
| `/login /signup /forgot-password /reset-password` | Main | done |
| `/dashboard /reports` | D | |
| `/customers`, `/customers/new`, `/customers/[id]` | D | B's subscription form reads customers |
| `/users` | D | ADMIN only (middleware + requireRole) |
| `/products[/new|/[id]]`, `/plans…`, `/taxes`, `/discounts…`, `/templates…` | A | |
| `/subscriptions`, `/subscriptions/new[?templateId=]`, `/subscriptions/[id]` | B | |
| `/invoices`, `/invoices/[id]`, **`/invoices/new?subscriptionId=…`** | C | B links to this to "Create invoice" — C's route generates the invoice for the subscription's next period and redirects to `/invoices/[id]` |
| `/payments` | C | `/invoices/[id]` hosts "Register payment" |
| `/portal`, `/portal/subscriptions[/id]`, `/portal/invoices[/id]` | D | CUSTOMER only; always filter by `session.customerId` |

## Cross-module links (no imports between session folders)
- B → C: link `/invoices/new?subscriptionId=<id>`; show subscription's invoices by querying `db.invoice` directly.
- C → B: link `/subscriptions/<id>`.
- D portal: renders `InvoiceDocument` (shared) and uses `transitionBlockReason` (shared) for customer pause/close.
- Bulk billing: C owns "Generate due invoices" (all ACTIVE subs with `nextInvoiceDate <= today`).
- Auto-close (plan.autoClose & expiryDate passed): B owns `closeExpiredSubscriptions()` in `src/lib/subscriptions/`, exposed as a "Close expired" button on `/subscriptions`.

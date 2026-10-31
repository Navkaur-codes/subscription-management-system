import type { Prisma } from "@prisma/client";
import { formatDate, formatMoney, toNum } from "@/lib/format";
import { displayStatus, outstanding } from "@/lib/invoice-status";
import { StatusBadge } from "./status-badge";

/** Query include that InvoiceDocument needs: db.invoice.findUnique({ where, include: invoiceDocumentInclude }) */
export const invoiceDocumentInclude = {
  customer: true,
  subscription: { select: { number: true, plan: { select: { name: true, billingPeriod: true } } } },
  lines: { include: { variant: true } },
  payments: { orderBy: { paymentDate: "asc" } },
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithDoc = Prisma.InvoiceGetPayload<{ include: typeof invoiceDocumentInclude }>;

/**
 * Printable invoice. Used by staff invoice detail (C) and customer portal (D).
 * Wrap the page in .print-area and hide chrome with .no-print; then window.print().
 */
export function InvoiceDocument({ invoice }: { invoice: InvoiceWithDoc }) {
  const c = invoice.customer;
  const due = outstanding(invoice);
  return (
    <div className="print-area rounded-xl border bg-card p-8 text-sm sm:p-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">B</span>
            Brightloop Software
          </div>
          <p className="mt-2 text-xs text-muted-foreground">billing@brightloop.test</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Invoice</p>
          <p className="text-xl font-semibold">{invoice.number}</p>
          <div className="mt-1">
            <StatusBadge status={displayStatus(invoice)} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Billed to</p>
          <p className="mt-1 font-medium">{c.name}</p>
          {c.company && <p>{c.company}</p>}
          <p className="text-muted-foreground">{c.email}</p>
          {c.address && <p className="text-muted-foreground">{c.address}</p>}
          {c.gstin && <p className="text-muted-foreground">GSTIN {c.gstin}</p>}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Dates</p>
          <p className="mt-1">Issued {formatDate(invoice.invoiceDate)}</p>
          <p>Due {formatDate(invoice.dueDate)}</p>
          {invoice.periodStart && (
            <p className="text-muted-foreground">
              Period {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Subscription</p>
          <p className="mt-1">{invoice.subscription?.number ?? "—"}</p>
          {invoice.subscription && <p className="text-muted-foreground">{invoice.subscription.plan.name}</p>}
        </div>
      </div>

      <table className="mt-8 w-full">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="py-2 text-left font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Unit price</th>
            <th className="py-2 text-right font-medium">Discount</th>
            <th className="py-2 text-right font-medium">Tax</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="num">
          {invoice.lines.map((l) => (
            <tr key={l.id} className="border-b last:border-0">
              <td className="py-2.5">
                {l.description}
                {l.variant && <span className="text-muted-foreground"> · {l.variant.attribute}: {l.variant.value}</span>}
              </td>
              <td className="py-2.5 text-right">{l.quantity}</td>
              <td className="py-2.5 text-right">{formatMoney(l.unitPrice)}</td>
              <td className="py-2.5 text-right">{toNum(l.discountAmount) ? `−${formatMoney(l.discountAmount)}` : "—"}</td>
              <td className="py-2.5 text-right">
                {formatMoney(l.taxAmount)} <span className="text-xs text-muted-foreground">({toNum(l.taxRate)}%)</span>
              </td>
              <td className="py-2.5 text-right font-medium">{formatMoney(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto grid w-full max-w-xs gap-1.5 num">
        <Row label="Subtotal" value={formatMoney(invoice.subtotal)} />
        {toNum(invoice.discountTotal) > 0 && <Row label="Discount" value={`−${formatMoney(invoice.discountTotal)}`} />}
        <Row label="Tax" value={formatMoney(invoice.taxTotal)} />
        <div className="my-1 border-t" />
        <Row label="Total" value={formatMoney(invoice.total)} strong />
        <Row label="Paid" value={formatMoney(invoice.amountPaid)} />
        <Row label="Amount due" value={formatMoney(due)} strong />
      </div>

      {invoice.payments.length > 0 && (
        <div className="mt-8">
          <p className="text-xs text-muted-foreground">Payments</p>
          <ul className="mt-2 space-y-1 num">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {formatDate(p.paymentDate)} · {p.method.replace("_", " ").toLowerCase()}
                  {p.note && <span className="text-muted-foreground"> · {p.note}</span>}
                </span>
                <span>{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {invoice.notes && <p className="mt-8 text-xs text-muted-foreground">{invoice.notes}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={strong ? "" : "text-foreground"}>{value}</span>
    </div>
  );
}

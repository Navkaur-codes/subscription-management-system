import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { INVOICE_TRANSITIONS, displayStatus, outstanding } from "@/lib/invoice-status";
import { formatDate, formatDateTime, formatMoney, toDateInput } from "@/lib/format";
import { InvoiceDocument, invoiceDocumentInclude } from "@/components/shared/invoice-document";
import { PrintButton } from "@/components/shared/print-button";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { SendButton } from "@/components/billing/send-button";
import { PaymentDialog } from "@/components/billing/payment-dialog";
import { CustomerCard, PaymentProgressCard } from "@/components/billing/invoice-side";
import { InvoiceActivity } from "@/components/billing/invoice-activity";
import { cancelInvoice, confirmInvoice, registerPayment, sendInvoice } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await db.invoice.findUnique({ where: { id }, select: { number: true } });
  return { title: inv ? `Invoice ${inv.number}` : "Invoice" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const invoice = await db.invoice.findUnique({ where: { id }, include: invoiceDocumentInclude });
  if (!invoice) notFound();

  const allowed = INVOICE_TRANSITIONS[invoice.status];
  const due = outstanding(invoice);
  const canCancel = allowed.includes("CANCELLED") && invoice.payments.length === 0;
  const canSend = invoice.status === "CONFIRMED" || invoice.status === "PAID";

  return (
    <div className="space-y-6">
      <div className="no-print rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5 sm:p-5 dark:ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Back to invoices">
              <Link href="/invoices">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Invoice</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
                <StatusBadge status={displayStatus(invoice)} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {invoice.customer.name} · {formatMoney(invoice.total)} · due {formatDate(invoice.dueDate)}
                {invoice.sentAt && <> · sent {formatDateTime(invoice.sentAt)}</>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canCancel && (
              <ActionButton
                action={cancelInvoice.bind(null, invoice.id)}
                variant="ghost"
                confirm={{
                  title: `Cancel ${invoice.number}?`,
                  description: "A cancelled invoice cannot be reopened. The billing period stays marked as billed.",
                  confirmLabel: "Cancel invoice",
                }}
              >
                Cancel
              </ActionButton>
            )}
            <PrintButton />
            {canSend && <SendButton action={sendInvoice.bind(null, invoice.id)} />}
            {allowed.includes("CONFIRMED") && (
              <ActionButton action={confirmInvoice.bind(null, invoice.id)} variant="default">
                <CheckCircle2 className="size-4" />
                Confirm
              </ActionButton>
            )}
            {invoice.status === "CONFIRMED" && due > 0 && (
              <PaymentDialog invoiceId={invoice.id} outstanding={due} today={toDateInput(new Date())} action={registerPayment} />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 print:block">
        <div className="min-w-0 lg:col-span-2">
          <div className="mx-auto max-w-3xl overflow-x-auto rounded-2xl shadow-card-hover print:overflow-visible print:shadow-none">
            <InvoiceDocument invoice={invoice} />
          </div>
        </div>
        <aside className="no-print space-y-6">
          <PaymentProgressCard invoice={invoice} />
          <CustomerCard invoice={invoice} />
          <InvoiceActivity invoice={invoice} />
        </aside>
      </div>
    </div>
  );
}

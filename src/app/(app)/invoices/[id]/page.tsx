import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Repeat } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { INVOICE_TRANSITIONS, displayStatus, outstanding } from "@/lib/invoice-status";
import { formatDateTime, toDateInput } from "@/lib/format";
import { InvoiceDocument, invoiceDocumentInclude } from "@/components/shared/invoice-document";
import { PrintButton } from "@/components/shared/print-button";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { SendButton } from "@/components/billing/send-button";
import { PaymentDialog } from "@/components/billing/payment-dialog";
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
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/invoices">
              <ArrowLeft className="size-4" />
              Invoices
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">{invoice.number}</h1>
          <StatusBadge status={displayStatus(invoice)} />
          {invoice.sentAt && <span className="text-xs text-muted-foreground">Sent {formatDateTime(invoice.sentAt)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.subscriptionId && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/subscriptions/${invoice.subscriptionId}`}>
                <Repeat className="size-4" />
                Subscription
              </Link>
            </Button>
          )}
          {canCancel && (
            <ActionButton
              action={cancelInvoice.bind(null, invoice.id)}
              confirm={{ title: "Cancel this invoice?", description: "A cancelled invoice cannot be reopened.", confirmLabel: "Cancel invoice" }}
            >
              Cancel
            </ActionButton>
          )}
          {canSend && <SendButton action={sendInvoice.bind(null, invoice.id)} />}
          <PrintButton />
          {allowed.includes("CONFIRMED") && (
            <ActionButton action={confirmInvoice.bind(null, invoice.id)} variant="default">
              Confirm
            </ActionButton>
          )}
          {invoice.status === "CONFIRMED" && due > 0 && (
            <PaymentDialog invoiceId={invoice.id} outstanding={due} today={toDateInput(new Date())} action={registerPayment} />
          )}
        </div>
      </div>
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}

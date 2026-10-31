import { Timeline } from "@/components/shared/display";
import type { InvoiceWithDoc } from "@/components/shared/invoice-document";
import { formatDate, formatMoney } from "@/lib/format";
import { METHOD_LABEL } from "@/lib/validators/billing";
import { SideCard } from "./invoice-side";

type Item = Parameters<typeof Timeline>[0]["items"][number];

/** Invoice history (issued, sent, payments, settled/cancelled), newest first. */
export function InvoiceActivity({ invoice }: { invoice: InvoiceWithDoc }) {
  const events: (Item & { at: Date })[] = [
    { at: invoice.createdAt, title: "Invoice issued", description: `Draft for ${formatMoney(invoice.total)}`, time: formatDate(invoice.createdAt), tone: "info" },
  ];
  if (invoice.sentAt) events.push({ at: invoice.sentAt, title: "Sent to customer", description: invoice.customer.email, time: formatDate(invoice.sentAt) });
  for (const p of invoice.payments) {
    events.push({
      at: p.paymentDate,
      title: `${formatMoney(p.amount)} received`,
      description: [METHOD_LABEL[p.method], p.reference].filter(Boolean).join(" · "),
      time: formatDate(p.paymentDate),
      tone: "success",
    });
  }
  if (invoice.status === "PAID" && invoice.paidAt)
    events.push({ at: invoice.paidAt, title: "Paid in full", time: formatDate(invoice.paidAt), tone: "success" });
  if (invoice.status === "CANCELLED") events.push({ at: invoice.updatedAt, title: "Cancelled", time: formatDate(invoice.updatedAt), tone: "danger" });

  const items: Item[] = events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <SideCard title="Activity">
      <Timeline items={items} />
    </SideCard>
  );
}

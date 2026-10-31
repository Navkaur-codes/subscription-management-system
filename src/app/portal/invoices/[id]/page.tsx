import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatMoney, humanize } from "@/lib/format";
import { portalCustomer } from "@/lib/insights/portal";
import { InvoiceDocument, invoiceDocumentInclude } from "@/components/shared/invoice-document";
import { PageHeader, Section } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { PrintButton } from "@/components/shared/print-button";

export const metadata = { title: "Invoice" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { customerId } = await portalCustomer();
  const { id } = await params;
  const invoice = await db.invoice.findFirst({
    where: { id, customerId, status: { in: ["CONFIRMED", "PAID"] } },
    include: invoiceDocumentInclude,
  });
  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={invoice.number} actions={<PrintButton />} />
      <InvoiceDocument invoice={invoice} />
      <div className="no-print">
        <Section title="Payment history">
          <DataTable
            rows={invoice.payments}
            columns={[
              { key: "d", header: "Date", cell: (p) => formatDate(p.paymentDate) },
              { key: "m", header: "Method", cell: (p) => humanize(p.method) },
              { key: "r", header: "Reference", cell: (p) => p.reference ?? "—" },
              { key: "a", header: "Amount", align: "right", cell: (p) => formatMoney(p.amount) },
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

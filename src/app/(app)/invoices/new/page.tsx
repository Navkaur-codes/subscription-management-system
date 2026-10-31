import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { generateInvoiceForSubscription, type GenerateResult } from "@/lib/billing/generate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";

// Billing runs can take a while; Vercel stops functions at their duration limit.
export const maxDuration = 60;

export const metadata = { title: "Create invoice" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ subscriptionId?: string }> }) {
  await requireRole("ADMIN", "STAFF");
  const { subscriptionId } = await searchParams;
  const res: GenerateResult = subscriptionId
    ? await generateInvoiceForSubscription(subscriptionId)
    : { status: "skipped", reason: "No subscription selected" };

  if (res.status === "created") redirect(`/invoices/${res.invoiceId}`);

  return (
    <>
      <PageHeader title="Create invoice" />
      <div className="card-surface">
        <EmptyState
          icon={CalendarCheck}
          title="Nothing to invoice"
          description={res.reason}
          action={
            <div className="flex gap-2">
              {res.invoiceId && (
                <Button asChild size="sm">
                  <Link href={`/invoices/${res.invoiceId}`}>Open existing invoice</Link>
                </Button>
              )}
              {subscriptionId && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/subscriptions/${subscriptionId}`}>Back to subscription</Link>
                </Button>
              )}
            </div>
          }
        />
      </div>
    </>
  );
}

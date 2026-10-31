import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/data-table";

// Placeholder — owned by Session D. Replace this file.
export const metadata = { title: "My invoices" };

export default function Page() {
  return (
    <>
      <PageHeader title="My invoices" />
      <div className="rounded-xl border bg-card">
        <EmptyState title="Coming soon" description="This module is being built." />
      </div>
    </>
  );
}

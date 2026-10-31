import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/data-table";

// Placeholder — owned by Session A. Replace this file.
export const metadata = { title: "Quotation templates" };

export default function Page() {
  return (
    <>
      <PageHeader title="Quotation templates" />
      <div className="rounded-xl border bg-card">
        <EmptyState title="Coming soon" description="This module is being built." />
      </div>
    </>
  );
}

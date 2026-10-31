import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/data-table";

// Placeholder — owned by Session D. Replace this file.
export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" />
      <div className="rounded-xl border bg-card">
        <EmptyState title="Coming soon" description="This module is being built." />
      </div>
    </>
  );
}

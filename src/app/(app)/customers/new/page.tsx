import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth";
import { NewCustomerForm } from "@/components/insights/customer-forms";

export const metadata = { title: "New customer" };

export default async function Page() {
  await requireRole("ADMIN", "STAFF");
  return (
    <>
      <PageHeader title="New customer" />
      <NewCustomerForm />
    </>
  );
}

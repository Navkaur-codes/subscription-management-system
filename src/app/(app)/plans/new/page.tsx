import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { PlanForm, emptyPlan } from "@/components/catalog/plan-form";

export const metadata = { title: "New plan" };

export default async function Page() {
  await requireRole("ADMIN");
  return (
    <>
      <PageHeader title="New plan" />
      <PlanForm initial={emptyPlan} readOnly={false} />
    </>
  );
}

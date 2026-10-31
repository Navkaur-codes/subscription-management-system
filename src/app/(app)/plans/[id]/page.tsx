import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toDateInput, toNum } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { PlanForm } from "@/components/catalog/plan-form";
import { ToggleDeleteActions } from "@/components/catalog/row-actions";
import { deletePlan, togglePlan } from "../actions";

export const metadata = { title: "Plan" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await params;
  const plan = await db.plan.findUnique({ where: { id } });
  if (!plan) notFound();
  const admin = user.role === "ADMIN";

  return (
    <>
      <PageHeader
        title={plan.name}
        description={admin ? "Edit plan" : "Read-only view"}
        actions={
          admin && (
            <ToggleDeleteActions
              id={plan.id}
              isActive={plan.isActive}
              noun="plan"
              toggle={togglePlan}
              remove={deletePlan}
              redirectAfterDelete="/plans"
            />
          )
        }
      />
      <PlanForm
        readOnly={!admin}
        initial={{
          id: plan.id,
          name: plan.name,
          price: String(toNum(plan.price)),
          billingPeriod: plan.billingPeriod,
          minQuantity: String(plan.minQuantity),
          startDate: toDateInput(plan.startDate),
          endDate: toDateInput(plan.endDate),
          autoClose: plan.autoClose,
          closable: plan.closable,
          pausable: plan.pausable,
          renewable: plan.renewable,
          isActive: plan.isActive,
          notes: plan.notes ?? "",
        }}
      />
    </>
  );
}

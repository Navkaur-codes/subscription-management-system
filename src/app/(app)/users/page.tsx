import { UserCog } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/list-controls";
import { AvatarName } from "@/components/shared/avatar-name";
import { MetricStrip } from "@/components/shared/metric-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { StaffSheet } from "@/components/insights/staff-sheet";
import { setUserActive } from "./actions";

export const metadata = { title: "Team members" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("ADMIN");
  const { page, skip, take } = pageParams(await searchParams);
  const where = { role: { in: ["ADMIN", "STAFF"] as ("ADMIN" | "STAFF")[] } };
  const [rows, total, admins, inactive] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.user.count({ where }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.user.count({ where: { ...where, isActive: false } }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Admin" icon={UserCog} title="Team members" description="Admins and staff who can sign in to Brightloop." actions={<StaffSheet />} />
      <MetricStrip
        items={[
          { label: "Team members", value: total },
          { label: "Admins", value: admins },
          { label: "Staff", value: total - admins },
          { label: "Deactivated", value: inactive },
        ]}
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Member", cell: (r) => <AvatarName name={r.name} sub={r.email} /> },
          { key: "role", header: "Role", cell: (r) => <StatusBadge status={r.role} tone="neutral" /> },
          {
            key: "active",
            header: "Status",
            cell: (r) => <StatusBadge status={r.isActive ? "ACTIVE" : "INACTIVE"} />,
          },
          { key: "created", header: "Created", cell: (r) => formatDate(r.createdAt) },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (r) =>
              r.id === me.userId ? null : r.isActive ? (
                <ActionButton
                  action={setUserActive.bind(null, r.id, false)}
                  confirm={{ title: `Deactivate ${r.name}?`, description: "They will no longer be able to sign in." }}
                >
                  Deactivate
                </ActionButton>
              ) : (
                <ActionButton action={setUserActive.bind(null, r.id, true)}>Activate</ActionButton>
              ),
          },
        ]}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}

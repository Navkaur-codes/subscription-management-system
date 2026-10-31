import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PAGE_SIZE, pageParams } from "@/lib/action";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/list-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { StaffSheet } from "@/components/insights/staff-sheet";
import { setUserActive } from "./actions";

export const metadata = { title: "Team members" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("ADMIN");
  const { page, skip, take } = pageParams(await searchParams);
  const where = { role: { in: ["ADMIN", "STAFF"] as ("ADMIN" | "STAFF")[] } };
  const [rows, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.user.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Team members" description="Admins and staff who can sign in to Brightloop." actions={<StaffSheet />} />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
          { key: "email", header: "Email", cell: (r) => r.email },
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

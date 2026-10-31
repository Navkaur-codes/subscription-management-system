"use client";
import { useQueryParams } from "@/components/shared/list-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Plan dropdown bound to ?plan=. */
export function PlanFilter({ plans }: { plans: { id: string; name: string }[] }) {
  const { sp, set } = useQueryParams();
  return (
    <Select value={sp.get("plan") ?? "all"} onValueChange={(v) => set({ plan: v === "all" ? null : v })}>
      <SelectTrigger className="w-full sm:w-48" size="sm">
        <SelectValue placeholder="All plans" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All plans</SelectItem>
        {plans.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

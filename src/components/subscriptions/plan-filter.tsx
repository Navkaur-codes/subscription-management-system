"use client";
import { useQueryParams } from "@/components/shared/list-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Plan dropdown bound to ?plan=. */
export function PlanFilter({ plans }: { plans: { id: string; name: string }[] }) {
  const { sp, set } = useQueryParams();
  const value = sp.get("plan") ?? "all";
  const current = plans.find((p) => p.id === value)?.name ?? "All plans";
  return (
    <Select value={value} onValueChange={(v) => set({ plan: v === "all" ? null : v })}>
      <SelectTrigger className="w-full sm:w-44">
        <SelectValue>{current}</SelectValue>
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

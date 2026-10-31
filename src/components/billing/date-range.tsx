"use client";
import { useQueryParams } from "@/components/shared/list-controls";
import { Input } from "@/components/ui/input";

/** From/to date inputs bound to ?from=&to= query params. */
export function DateRange() {
  const { sp, set } = useQueryParams();
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Input
        type="date"
        aria-label="From date"
        className="w-36"
        defaultValue={sp.get("from") ?? ""}
        onChange={(e) => set({ from: e.target.value })}
      />
      <span>to</span>
      <Input
        type="date"
        aria-label="To date"
        className="w-36"
        defaultValue={sp.get("to") ?? ""}
        onChange={(e) => set({ to: e.target.value })}
      />
    </div>
  );
}


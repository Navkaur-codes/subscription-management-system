"use client";
import { LayoutGrid, List } from "lucide-react";
import { useQueryParams } from "@/components/shared/list-controls";
import { cn } from "@/lib/utils";

/** Grid/list switch bound to ?view=. Grid is the default. */
export function ViewToggle({ current }: { current: "grid" | "list" }) {
  const { set } = useQueryParams();
  const opts = [
    { value: "grid", label: "Grid view", Icon: LayoutGrid },
    { value: "list", label: "List view", Icon: List },
  ] as const;
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5">
      {opts.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={current === value}
          onClick={() => set({ view: value === "grid" ? null : value })}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
            current === value && "bg-muted text-foreground"
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

import { Check, Pause } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STEPS: SubscriptionStatus[] = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"];

/** Linear lifecycle progress; PAUSED is shown as a side state of ACTIVE. */
export function StatusStepper({ status }: { status: SubscriptionStatus }) {
  const paused = status === "PAUSED";
  const current = STEPS.indexOf(paused ? "ACTIVE" : status);
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {STEPS.map((s, i) => {
        const done = i < current || (s === "CLOSED" && status === "CLOSED");
        const active = i === current;
        return (
          <li key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-xs font-medium",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && !done && "border-brand bg-brand-soft text-brand",
                  !done && !active && "text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : active && paused ? <Pause className="size-3" /> : i + 1}
              </span>
              <span className={cn("text-sm", active ? "font-medium text-foreground" : "text-muted-foreground")}>
                {s === "ACTIVE" && paused ? "Active · paused" : s[0] + s.slice(1).toLowerCase()}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className={cn("mx-3 h-px w-8 bg-border sm:w-12", i < current && "bg-primary")} />}
          </li>
        );
      })}
    </ol>
  );
}

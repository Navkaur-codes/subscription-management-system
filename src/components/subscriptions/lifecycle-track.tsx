"use client";
import { useEffect, useState } from "react";
import { Pause } from "lucide-react";
import type { SubscriptionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { FlipIndicator } from "@/components/motion";

const STEPS: SubscriptionStatus[] = ["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "CLOSED"];
const LABEL: Record<SubscriptionStatus, string> = {
  DRAFT: "Draft",
  QUOTATION: "Quotation",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

/**
 * Subscription lifecycle on a ruled track. After a status change the ember fill tweens to the new
 * step and the current-step ring glides there (FlipIndicator); PAUSED sits on Active as a side state.
 */
export function LifecycleTrack({ status }: { status: SubscriptionStatus }) {
  const paused = status === "PAUSED";
  const current = STEPS.indexOf(paused ? "ACTIVE" : status);
  const target = (current / (STEPS.length - 1)) * 100;
  const [fill, setFill] = useState(0);

  useEffect(() => {
    // A timeout (not rAF) so the fill still lands in background tabs, where rAF is paused.
    const id = setTimeout(() => setFill(target), 40);
    return () => clearTimeout(id);
  }, [target]);

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="relative grid min-w-[290px] grid-cols-5" aria-label="Subscription lifecycle">
        <span aria-hidden className="absolute top-[7px] right-[10%] left-[10%] h-px bg-border" />
        <span aria-hidden className="absolute top-[6px] left-[10%] h-[3px] w-[80%] overflow-hidden">
          <span
            className="block h-full origin-left bg-ember transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ transform: `scaleX(${fill / 100})` }}
          />
        </span>
        {STEPS.map((s, i) => {
          const done = i < current || (s === "CLOSED" && status === "CLOSED");
          const active = i === current;
          return (
            <li key={s} className="relative flex flex-col items-center text-center" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "relative z-10 flex size-4 items-center justify-center rounded-full border-2 bg-card transition-colors duration-500",
                  (done || active) && "border-ember",
                  done && "bg-ember",
                  !done && !active && "border-border"
                )}
              >
                {active && <FlipIndicator layoutId="subscription-lifecycle" className="absolute -inset-[5px] rounded-full border-2 border-ember-soft" />}
                {active && paused && <Pause className="size-2 fill-ember text-ember" />}
              </span>
              <span className="font-mono-num mt-2 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className={cn("text-[11px] leading-tight sm:text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {active && paused ? (
                  <>
                    Active <span className="block text-ember sm:inline">· {LABEL.PAUSED}</span>
                  </>
                ) : (
                  LABEL[s]
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

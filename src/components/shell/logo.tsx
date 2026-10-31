import { cn } from "@/lib/utils";
import { Orbit } from "@/components/motion";

/** Orbit mark (the loop + one ember payment) with the wordmark. Ring follows currentColor. */
export function Logo({
  withText = true,
  animated = false,
  className,
  textClassName,
}: {
  withText?: boolean;
  /** slow travelling dot (sidebar); static mark everywhere else */
  animated?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {animated ? (
        <Orbit size={26} dots={1} speed={14} />
      ) : (
        <svg viewBox="0 0 32 32" className="size-[26px] shrink-0" aria-hidden>
          <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="16" cy="5" r="4.2" fill="var(--ember)" />
        </svg>
      )}
      {withText && <span className={cn("text-[16px] font-semibold tracking-tight", textClassName)}>Brightloop</span>}
    </span>
  );
}

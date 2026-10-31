import { cn } from "@/lib/utils";

/** Gradient logo mark (a looping "B"), optionally with the wordmark. */
export function Logo({ withText = true, className, textClassName }: { withText?: boolean; className?: string; textClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-brand-gradient text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_6px_16px_-6px_rgb(124_58_237/0.8)]">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
          <path d="M7 4v16" />
          <path d="M7 4h5.5a3.75 3.75 0 0 1 0 7.5H7" />
          <path d="M7 11.5h6.5a4.25 4.25 0 0 1 0 8.5H11" />
        </svg>
      </span>
      {withText && <span className={cn("text-[15px] font-semibold tracking-tight", textClassName)}>Brightloop</span>}
    </span>
  );
}

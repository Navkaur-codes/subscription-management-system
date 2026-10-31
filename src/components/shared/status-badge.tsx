import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<string, Tone> = {
  // subscriptions
  DRAFT: "neutral",
  QUOTATION: "info",
  CONFIRMED: "info",
  ACTIVE: "success",
  PAUSED: "warning",
  CLOSED: "neutral",
  // invoices
  PAID: "success",
  CANCELLED: "neutral",
  OVERDUE: "danger",
  PARTIAL: "warning",
  // generic
  INACTIVE: "neutral",
  EXPIRED: "neutral",
};

const PILL: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-neutral",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-dot-neutral",
  info: "bg-dot-info",
  success: "bg-dot-success",
  warning: "bg-dot-warning",
  danger: "bg-dot-danger",
};

/** Soft tinted pill with a dot. The ONLY place status colours appear. */
export function StatusBadge({
  status,
  tone,
  label,
  className,
}: {
  status: string;
  tone?: Tone;
  label?: string;
  className?: string;
}) {
  const t = tone ?? TONES[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-current/15 ring-inset",
        PILL[t],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[t])} />
      {label ?? humanize(status)}
    </span>
  );
}

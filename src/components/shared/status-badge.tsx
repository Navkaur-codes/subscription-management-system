import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

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

const DOT: Record<Tone, string> = {
  neutral: "bg-dot-neutral",
  info: "bg-dot-info",
  success: "bg-dot-success",
  warning: "bg-dot-warning",
  danger: "bg-dot-danger",
};

/** Outline pill with a small coloured dot. The ONLY place status colours appear. */
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
        "inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        t === "danger" && "border-destructive/30 text-destructive",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[t])} />
      {label ?? humanize(status)}
    </span>
  );
}

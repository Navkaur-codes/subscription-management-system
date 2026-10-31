import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevealText } from "@/components/motion";

/**
 * Top of every page: mono eyebrow, serif title revealed line by line, description, actions, ruled line.
 * Put the accent word in <em>: title={<>Active <em>subscriptions</em></>}.
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  icon: Icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {(eyebrow || Icon) && (
            <p className="mb-3 flex items-center gap-2.5 font-mono-num text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              <span className="h-px w-6 bg-ember" />
              {Icon && <Icon className="size-3.5" strokeWidth={1.75} />}
              {eyebrow}
            </p>
          )}
          <RevealText
            as="h1"
            className="font-display text-[34px] leading-[1.05] text-foreground sm:text-[44px] [&_em]:text-ember"
          >
            {title}
          </RevealText>
          {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Titled section inside a page or form. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/** Card wrapper for a chart (or any visual block) with title row. */
export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-stagger className={cn("flex flex-col rounded-xl border border-border bg-card p-5 shadow-card sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

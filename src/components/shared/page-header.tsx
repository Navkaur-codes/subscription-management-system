import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Top of every page: optional eyebrow + icon tile, title, description, right-aligned actions. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  icon: Icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {Icon && (
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-8px_rgb(76_50_220/0.6)] sm:flex">
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-9">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
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
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-surface", className)}>
      <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-6">{children}</div>
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
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-stagger className={cn("card-surface flex flex-col p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

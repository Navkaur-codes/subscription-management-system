import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Orbit } from "@/components/motion";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

/**
 * Server-friendly table. Pass already-paginated rows.
 * Money columns: align "right" — cells get tabular numbers automatically.
 * rowHref makes the whole row a link target (via an overlay <a>).
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  rowHref,
  empty,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  empty?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-30 bg-card">
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "h-10 px-5 font-mono-num text-[10.5px] font-normal tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{empty ?? <EmptyState title="Nothing here yet" />}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-stagger
                  className={cn(
                    "group/row relative border-b border-border/70 transition-colors last:border-0 hover:bg-muted/60",
                    rowHref && "cursor-pointer"
                  )}
                >
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      className={cn(
                        "h-13 px-5 whitespace-nowrap",
                        // overlay link (z-10) takes row clicks; real controls inside cells stay clickable above it
                        rowHref && "[&_a:not([data-row-link])]:relative [&_a:not([data-row-link])]:z-20 [&_button]:relative [&_button]:z-20 [&_input]:relative [&_input]:z-20",
                        c.align === "right" && "font-mono-num text-right text-[13px]",
                        c.align === "center" && "text-center",
                        c.className
                      )}
                    >
                      {i === 0 && rowHref && (
                        <a href={rowHref(row)} data-row-link className="absolute inset-0 z-10" aria-label="Open" />
                      )}
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer && <tfoot className="border-t border-border bg-muted/40 font-medium">{footer}</tfoot>}
        </table>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Orbit size={72} dots={2} speed={14} className="mb-3 text-muted-foreground">
        {Icon && <Icon className="size-4 text-foreground" strokeWidth={1.75} />}
      </Orbit>
      <p className="font-display text-2xl leading-tight">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

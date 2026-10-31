import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-30 bg-muted/50 backdrop-blur">
            <tr className="border-b">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "h-10 px-5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase",
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
                    "group/row relative border-b border-border/70 transition-colors last:border-0 hover:bg-brand-soft/40",
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
                        c.align === "right" && "num text-right",
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
          {footer && <tfoot className="border-t bg-muted/40 font-medium">{footer}</tfoot>}
        </table>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="mb-2 rounded-2xl bg-brand-gradient p-px shadow-[0_8px_24px_-10px_rgb(76_50_220/0.6)]">
        <div className="flex size-12 items-center justify-center rounded-[15px] bg-card">
          <Icon className="size-5 text-brand" />
        </div>
      </div>
      <p className="text-[15px] font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

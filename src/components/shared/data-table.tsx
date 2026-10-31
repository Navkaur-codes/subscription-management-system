import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
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
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <tr className="border-b">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "h-10 px-4 text-xs font-medium whitespace-nowrap text-muted-foreground",
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
                <td colSpan={columns.length}>
                  {empty ?? <EmptyState title="Nothing here yet" />}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-stagger
                  className={cn(
                    "relative border-b last:border-0 transition-colors hover:bg-muted/40",
                    rowHref && "cursor-pointer"
                  )}
                >
                  {columns.map((c, i) => (
                    <td
                      key={c.key}
                      className={cn(
                        "h-12 px-4 whitespace-nowrap",
                        c.align === "right" && "num text-right",
                        c.align === "center" && "text-center",
                        c.className
                      )}
                    >
                      {i === 0 && rowHref && (
                        <a href={rowHref(row)} className="absolute inset-0" aria-label="Open" />
                      )}
                      <span className="relative">{c.cell(row)}</span>
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
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border bg-muted">
        <Inbox className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Instant placeholder shown by route-level loading.tsx while the server renders a page:
 * eyebrow + title, a KPI strip and a table, matching the shape of most pages.
 */
export function PageSkeleton({ kpis = 4, rows = 8 }: { kpis?: number; rows?: number }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-4 border-b border-border pb-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {kpis > 0 && (
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col">
          {Array.from({ length: kpis }, (_, i) => (
            <div key={i} className="space-y-4 bg-card p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/70 px-5 py-3.5 last:border-0">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

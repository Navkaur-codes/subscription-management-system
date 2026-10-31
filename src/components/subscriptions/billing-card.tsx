import type { ReactNode } from "react";

/** Right-column card of label/value rows (billing summary). */
export function BillingCard({ title, rows }: { title: string; rows: { label: string; value: ReactNode }[] }) {
  return (
    <section className="card-surface p-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <dl className="mt-4 divide-y text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="num text-right font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

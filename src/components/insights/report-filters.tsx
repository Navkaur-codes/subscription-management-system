"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterTabs, SearchInput, useQueryParams } from "@/components/shared/list-controls";
import { humanize } from "@/lib/format";
import { STATUS_OPTIONS, type ReportView } from "@/lib/insights/report-options";

export function ReportFilters({ view, plans }: { view: ReportView; plans: { id: string; name: string }[] }) {
  const { sp, set } = useQueryParams();
  const exportHref = `/reports/export?${sp.toString()}`;
  const all = "__all";
  const status = sp.get("status");
  const plan = sp.get("plan");

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterTabs
          param="view"
          options={[
            { value: "subscriptions", label: "Subscriptions" },
            { value: "invoices", label: "Invoices" },
            { value: "payments", label: "Payments" },
          ]}
        />
        <Button variant="outline" size="sm" asChild>
          <a href={exportHref}>
            <Download className="size-4" /> Export CSV
          </a>
        </Button>
      </div>
      <div className="card-surface flex flex-wrap items-center gap-2 p-3">
        <Input type="date" aria-label="From" className="w-40" value={sp.get("from") ?? ""} onChange={(e) => set({ from: e.target.value })} />
        <Input type="date" aria-label="To" className="w-40" value={sp.get("to") ?? ""} onChange={(e) => set({ to: e.target.value })} />
        <Select value={sp.get("status") ?? all} onValueChange={(v) => set({ status: v === all ? null : v })}>
          <SelectTrigger className="w-44">
            <SelectValue>{status ? humanize(status) : view === "payments" ? "All methods" : "All statuses"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={all}>{view === "payments" ? "All methods" : "All statuses"}</SelectItem>
            {STATUS_OPTIONS[view].map((s) => (
              <SelectItem key={s} value={s}>
                {humanize(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sp.get("plan") ?? all} onValueChange={(v) => set({ plan: v === all ? null : v })}>
          <SelectTrigger className="w-44">
            <SelectValue>{plans.find((p) => p.id === plan)?.name ?? "All plans"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={all}>All plans</SelectItem>
            {plans.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchInput placeholder="Customer name or email…" />
      </div>
    </div>
  );
}

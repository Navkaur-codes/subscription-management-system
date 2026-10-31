"use client";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Hook: update one or more query params (resets page to 1). */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const set = (updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in updates)) next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { sp, set, pending };
}

/** Debounced ?q= search box. */
export function SearchInput({ placeholder = "Search…", param = "q" }: { placeholder?: string; param?: string }) {
  const { sp, set } = useQueryParams();
  const [value, setValue] = useState(sp.get(param) ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get(param) ?? "") !== value) set({ [param]: value });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

/** Segmented filter tabs bound to a query param, e.g. status. */
export function FilterTabs({
  param,
  options,
}: {
  param: string;
  options: { value: string; label: string }[];
}) {
  const { sp, set } = useQueryParams();
  const current = sp.get(param) ?? "";
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => set({ [param]: o.value })}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            current === o.value && "bg-muted text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Row above a table holding search + filters. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}

/** Prev/next pagination with "x–y of total". */
export function Pagination({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const n = new URLSearchParams(sp.toString());
    n.set("page", String(p));
    return `${pathname}?${n.toString()}`;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
      <span className="num">
        {from}–{to} of {total.toLocaleString("en-IN")}
      </span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" asChild disabled={page <= 1}>
          <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} className={cn(page <= 1 && "pointer-events-none opacity-50")}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={href(Math.min(pages, page + 1))} aria-disabled={page >= pages} className={cn(page >= pages && "pointer-events-none opacity-50")}>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

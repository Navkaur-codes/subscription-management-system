"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { CalendarClock, Moon, ReceiptText, Search, Sun, User } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { Role } from "@/lib/session";
import type { SearchHit, SearchResult } from "@/app/(app)/search/route";
import { NAV } from "./nav";

const GROUPS: { key: keyof SearchResult; label: string; icon: typeof User }[] = [
  { key: "customers", label: "Customers", icon: User },
  { key: "subscriptions", label: "Subscriptions", icon: CalendarClock },
  { key: "invoices", label: "Invoices", icon: ReceiptText },
];

/** ⌘K / Ctrl+K: jump to any page, or find customers, subscriptions and invoices. */
export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<SearchResult>) : null))
        .then((d) => setHits(d))
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const pages = useMemo(() => {
    const term = q.trim().toLowerCase();
    return NAV.flatMap((g) => g.items.filter((i) => i.roles.includes(role)).map((i) => ({ ...i, group: g.label }))).filter(
      (i) => !term || i.label.toLowerCase().includes(term) || i.group.toLowerCase().includes(term)
    );
  }, [q, role]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-xl border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-brand/40 hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Search or jump to…</span>
        <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-xl" title="Search" description="Search pages, customers, subscriptions and invoices">
        <Command shouldFilter={false}>
          <CommandInput value={q} onValueChange={setQ} placeholder="Search customers, SUB/…, INV/… or a page" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>{loading ? "Searching…" : "No results."}</CommandEmpty>
            {GROUPS.map(({ key, label, icon: Icon }) =>
              hits?.[key].length ? (
                <CommandGroup key={key} heading={label}>
                  {hits[key].map((h: SearchHit) => (
                    <CommandItem key={h.id} value={`${key}-${h.id}`} onSelect={() => go(h.href)}>
                      <Icon className="text-muted-foreground" />
                      <span className="font-medium">{h.label}</span>
                      <span className="truncate text-xs text-muted-foreground">{h.sub}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null
            )}
            {pages.length > 0 && (
              <CommandGroup heading="Pages">
                {pages.map((p) => (
                  <CommandItem key={p.href} value={`page-${p.href}`} onSelect={() => go(p.href)}>
                    <p.icon className="text-muted-foreground" />
                    {p.label}
                    <CommandShortcut>{p.group}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!q && (
              <CommandGroup heading="Preferences">
                <CommandItem
                  value="toggle-theme"
                  onSelect={() => {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark");
                    setOpen(false);
                  }}
                >
                  {resolvedTheme === "dark" ? <Sun /> : <Moon />}
                  Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

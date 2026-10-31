import type { Prisma } from "@prisma/client";
import { formatMoney, toNum } from "@/lib/format";

/** Parse ?from=&to= (yyyy-mm-dd) into a Prisma date filter, inclusive of the whole "to" day. */
export function dateFilter(from?: string, to?: string) {
  const parse = (v: string | undefined, time: string) => {
    if (!v) return undefined;
    const d = new Date(`${v}T${time}`);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const gte = parse(from, "00:00:00");
  const lte = parse(to, "23:59:59.999");
  return gte || lte ? { gte, lte } : undefined;
}

export function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

/** Whole-rupee money for big summary figures (keeps them on one line on phones). */
export function formatRupees(v: number | Prisma.Decimal | null): string {
  return formatMoney(Math.round(toNum(v ?? 0))).replace(/\.00$/, "");
}

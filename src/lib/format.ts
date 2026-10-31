import { format as fmtDate } from "date-fns";

type DecimalLike = { toString(): string } | number | string | null | undefined;

/** Convert Prisma Decimal / string / number to a JS number (null → 0). */
export function toNum(v: DecimalLike): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

/** Round to 2 decimals (paise). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,23,456.00 */
export function formatMoney(v: DecimalLike): string {
  return inr.format(toNum(v));
}

/** 31 Oct 2026 */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return fmtDate(new Date(d), "dd MMM yyyy");
}

/** 31 Oct 2026, 14:05 */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return fmtDate(new Date(d), "dd MMM yyyy, HH:mm");
}

/** yyyy-MM-dd for <input type="date"> */
export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return fmtDate(new Date(d), "yyyy-MM-dd");
}

/** ENUM_VALUE → "Enum value" */
export function humanize(s: string): string {
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

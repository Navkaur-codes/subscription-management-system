import { addDays, addMonths, addWeeks, addYears, startOfDay } from "date-fns";
import type { BillingPeriod } from "@prisma/client";

/** Advance a date by N billing periods. */
export function addPeriod(date: Date, period: BillingPeriod, count = 1): Date {
  switch (period) {
    case "DAILY":
      return addDays(date, count);
    case "WEEKLY":
      return addWeeks(date, count);
    case "MONTHLY":
      return addMonths(date, count);
    case "YEARLY":
      return addYears(date, count);
  }
}

/** Billing period that starts at `start`: [start, end) where end = start + 1 period. */
export function periodRange(start: Date, period: BillingPeriod) {
  const s = startOfDay(start);
  return { periodStart: s, periodEnd: addPeriod(s, period) };
}

/** Monthly-equivalent multiplier, used for MRR-style normalisation. */
export function monthlyFactor(period: BillingPeriod): number {
  switch (period) {
    case "DAILY":
      return 30;
    case "WEEKLY":
      return 52 / 12;
    case "MONTHLY":
      return 1;
    case "YEARLY":
      return 1 / 12;
  }
}

export function today(): Date {
  return startOfDay(new Date());
}

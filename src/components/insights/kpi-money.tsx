"use client";
import { CountUp } from "@/components/motion";
import { formatMoney } from "@/lib/format";

/** Animated ₹ amount for KPI cards. */
export function MoneyCount({ value }: { value: number }) {
  return <CountUp value={value} format={formatMoney} />;
}

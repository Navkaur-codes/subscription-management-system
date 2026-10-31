"use client";
import { CountUp } from "@/components/motion";
import { shortMoney } from "@/lib/insights/money";

/** Animated ₹ amount for KPI cards. */
export function MoneyCount({ value }: { value: number }) {
  return <CountUp value={value} format={shortMoney} />;
}

"use client";
import { ScrambleNumber } from "@/components/motion";

/** Animated ₹ amount (Cr / L short form) for KPI cells. */
export function MoneyCount({ value }: { value: number }) {
  return <ScrambleNumber value={value} format="compact-money" />;
}

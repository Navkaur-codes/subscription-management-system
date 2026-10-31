import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Indian compact money for tight KPI cells: ₹9.12 Cr / ₹4.50 L; smaller values unchanged. */
export function compactMoney(v: number): string {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

/** Mono figure for IDs and money inside table cells. */
export function Mono({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <span className={cn("font-mono-num", strong && "font-medium")}>{children}</span>;
}

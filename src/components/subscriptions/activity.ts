import type { ComponentProps } from "react";
import { CalendarCheck, CircleSlash, FilePlus2, FileText, Receipt } from "lucide-react";
import type { Timeline } from "@/components/shared/display";
import { formatDate, formatMoney } from "@/lib/format";

type Item = ComponentProps<typeof Timeline>["items"][number] & { at: Date };

type Sub = {
  createdAt: Date;
  startDate: Date;
  closedAt: Date | null;
  createdBy: { name: string } | null;
};
type Inv = { number: string; invoiceDate: Date; status: string; total: number };

/** Known events for a subscription, newest first (latest 5 invoices). */
export function activity(sub: Sub, invoices: Inv[]) {
  const now = new Date();
  const items: Item[] = [
    { at: sub.createdAt, title: "Created", description: sub.createdBy ? `by ${sub.createdBy.name}` : undefined, time: formatDate(sub.createdAt), icon: FilePlus2, tone: "brand" },
    {
      at: sub.startDate,
      title: sub.startDate <= now ? "Started" : "Starts",
      time: formatDate(sub.startDate),
      icon: CalendarCheck,
      tone: "info",
    },
    ...invoices.slice(0, 5).map<Item>((inv) => ({
      at: inv.invoiceDate,
      title: `Invoice ${inv.number}`,
      description: `${formatMoney(inv.total)} · ${inv.status.toLowerCase()}`,
      time: formatDate(inv.invoiceDate),
      icon: inv.status === "PAID" ? Receipt : FileText,
      tone: inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "danger" : "neutral",
    })),
    ...(sub.closedAt
      ? [{ at: sub.closedAt, title: "Closed", time: formatDate(sub.closedAt), icon: CircleSlash, tone: "neutral" } as Item]
      : []),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

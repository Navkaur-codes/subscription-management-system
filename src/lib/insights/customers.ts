import { db } from "@/lib/db";
import { toNum } from "@/lib/format";

/** Active-subscription counts and outstanding balances for a page of customers. */
export async function customerStats(ids: string[]) {
  const [subs, inv] = await Promise.all([
    db.subscription.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids }, status: "ACTIVE" },
      _count: { _all: true },
    }),
    db.invoice.groupBy({
      by: ["customerId"],
      where: { customerId: { in: ids }, status: "CONFIRMED" },
      _sum: { total: true, amountPaid: true },
    }),
  ]);
  const active = new Map(subs.map((s) => [s.customerId, s._count._all]));
  const due = new Map(inv.map((i) => [i.customerId, toNum(i._sum.total) - toNum(i._sum.amountPaid)]));
  return { active, due };
}

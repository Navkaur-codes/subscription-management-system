import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";

/** Signed-in customer's id. Every portal query must filter by this. */
export async function portalCustomer() {
  const s = await requireRole("CUSTOMER");
  if (!s.customerId) notFound();
  return { customerId: s.customerId, name: s.name };
}

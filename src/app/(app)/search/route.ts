import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type SearchHit = { id: string; label: string; sub: string; href: string };
export type SearchResult = { customers: SearchHit[]; subscriptions: SearchHit[]; invoices: SearchHit[] };

const TAKE = 5;

/** ⌘K palette: top 5 customers / subscriptions / invoices matching ?q= (team only). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 64);
  const empty: SearchResult = { customers: [], subscriptions: [], invoices: [] };
  if (q.length < 2) return NextResponse.json(empty);

  const like = { contains: q, mode: "insensitive" as const };
  const [customers, subscriptions, invoices] = await Promise.all([
    db.customer.findMany({
      where: { OR: [{ name: like }, { email: like }, { company: like }] },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: TAKE,
    }),
    db.subscription.findMany({
      where: { OR: [{ number: like }, { customer: { name: like } }] },
      select: { id: true, number: true, status: true, customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    db.invoice.findMany({
      where: { OR: [{ number: like }, { customer: { name: like } }] },
      select: { id: true, number: true, status: true, customer: { select: { name: true } } },
      orderBy: { invoiceDate: "desc" },
      take: TAKE,
    }),
  ]);

  const body: SearchResult = {
    customers: customers.map((c) => ({ id: c.id, label: c.name, sub: c.email, href: `/customers/${c.id}` })),
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      label: s.number,
      sub: `${s.customer.name} · ${s.status.toLowerCase()}`,
      href: `/subscriptions/${s.id}`,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      label: i.number,
      sub: `${i.customer.name} · ${i.status.toLowerCase()}`,
      href: `/invoices/${i.id}`,
    })),
  };
  return NextResponse.json(body);
}

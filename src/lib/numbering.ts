import type { Prisma } from "@prisma/client";
import { db } from "./db";

type Tx = Prisma.TransactionClient;

/**
 * Next human-readable document number, e.g. SUB/2026/00001 or INV/2026/00042.
 * Atomic (upsert + increment) so concurrent creates never collide.
 * Pass the transaction client when called inside db.$transaction.
 */
export async function nextNumber(prefix: "SUB" | "INV", tx: Tx = db): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const seq = await tx.sequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}/${year}/${String(seq.value).padStart(5, "0")}`;
}

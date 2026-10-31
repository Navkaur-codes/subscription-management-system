"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { fail, ok, toFail, type ActionResult } from "@/lib/action";
import { customerSchema, type CustomerInput } from "@/lib/validators/customer";

async function emailTaken(email: string, exceptId?: string) {
  const found = await db.customer.findUnique({ where: { email }, select: { id: true } });
  return !!found && found.id !== exceptId;
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN", "STAFF");
    const data = customerSchema.parse(input);
    if (await emailTaken(data.email)) return fail("Email already in use", { email: "A customer with this email already exists" });
    const user = await db.user.findUnique({ where: { email: data.email }, select: { id: true, role: true } });
    const linked = user?.role === "CUSTOMER" ? await db.customer.findUnique({ where: { userId: user.id }, select: { id: true } }) : null;
    const c = await db.customer.create({
      data: { ...data, userId: user?.role === "CUSTOMER" && !linked ? user.id : undefined },
    });
    revalidatePath("/customers");
    return ok({ id: c.id }, "Customer created");
  } catch (e) {
    return toFail(e);
  }
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN", "STAFF");
    const data = customerSchema.parse(input);
    if (await emailTaken(data.email, id)) return fail("Email already in use", { email: "A customer with this email already exists" });
    await db.customer.update({
      where: { id },
      data: {
        ...data,
        phone: data.phone ?? null,
        company: data.company ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        gstin: data.gstin ?? null,
      },
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return ok({ id }, "Customer saved");
  } catch (e) {
    return toFail(e);
  }
}

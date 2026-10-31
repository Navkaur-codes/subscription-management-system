"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { fail, ok, toFail, type ActionResult } from "@/lib/action";
import { staffSchema, type StaffInput } from "@/lib/validators/user";

export async function createStaff(input: StaffInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");
    const data = staffSchema.parse(input);
    if (await db.user.findUnique({ where: { email: data.email }, select: { id: true } }))
      return fail("Email already in use", { email: "A user with this email already exists" });
    const u = await db.user.create({
      data: { name: data.name, email: data.email, role: data.role, passwordHash: await hashPassword(data.password) },
    });
    revalidatePath("/users");
    return ok({ id: u.id }, "Team member added");
  } catch (e) {
    return toFail(e);
  }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const me = await requireRole("ADMIN");
    if (me.userId === userId) return fail("You cannot deactivate your own account");
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target || target.role === "CUSTOMER") return fail("User not found");
    await db.user.update({ where: { id: userId }, data: { isActive } });
    revalidatePath("/users");
    return ok(undefined, isActive ? "User activated" : "User deactivated");
  } catch (e) {
    return toFail(e);
  }
}

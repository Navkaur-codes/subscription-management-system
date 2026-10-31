import { getSession } from "@/lib/auth";
import { fail } from "@/lib/action";

/** For catalog mutations: returns a fail() result unless the caller is an ADMIN. */
export async function adminGuard() {
  const s = await getSession();
  if (!s) return fail("Please sign in again");
  if (s.role !== "ADMIN") return fail("Only admins can change this");
  return null;
}

export async function isAdmin() {
  return (await getSession())?.role === "ADMIN";
}

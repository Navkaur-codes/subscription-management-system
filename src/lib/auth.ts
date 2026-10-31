import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifySession,
  type Role,
  type SessionPayload,
} from "./session";

export type { Role, SessionPayload };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(p: SessionPayload) {
  const token = await signSession(p);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user or null. Use in server components / actions. */
export async function getSession(): Promise<SessionPayload | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Guard for pages and server actions. Redirects to /login if signed out,
 * to /forbidden if the role is not allowed. Call at the top of every action.
 *   const user = await requireRole("ADMIN", "STAFF");
 */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (roles.length && !roles.includes(s.role)) redirect("/forbidden");
  return s;
}

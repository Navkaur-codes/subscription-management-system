// Edge-safe JWT helpers (used by middleware and server code). No DB / Node imports here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bl_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  customerId: string | null;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT(p)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/** Where each role lands after login. */
export function homeFor(role: Role): string {
  return role === "CUSTOMER" ? "/portal" : "/dashboard";
}

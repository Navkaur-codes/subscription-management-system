import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, homeFor, verifySession } from "@/lib/session";

const PUBLIC = ["/login", "/signup", "/forgot-password", "/reset-password"];
const ADMIN_ONLY = ["/users"];

/** Coarse route guard. Server actions/pages must still call requireRole(). */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  if (!session) {
    if (isPublic) return NextResponse.next();
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic) return NextResponse.redirect(new URL(homeFor(session.role), req.url));

  const inPortal = pathname.startsWith("/portal");
  if (session.role === "CUSTOMER" && !inPortal && pathname !== "/forbidden")
    return NextResponse.redirect(new URL("/portal", req.url));
  if (session.role !== "CUSTOMER" && inPortal)
    return NextResponse.redirect(new URL("/dashboard", req.url));
  if (session.role !== "ADMIN" && ADMIN_ONLY.some((p) => pathname.startsWith(p)))
    return NextResponse.redirect(new URL("/forbidden", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};

import { ZodError } from "zod";

/** Standard return shape for every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Convert ZodError / Prisma unique errors / unknown into a fail() result. */
export function toFail(e: unknown): ActionResult<never> {
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of e.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return fail(e.issues[0]?.message ?? "Invalid input", fieldErrors);
  }
  if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
    return fail("A record with these details already exists");
  }
  // Let Next.js redirects (from requireRole) propagate.
  if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
    throw e;
  }
  console.error(e);
  return fail(e instanceof Error ? e.message : "Something went wrong");
}

/** Read ?page=&q= style params with defaults. PAGE_SIZE is the app-wide table size. */
export const PAGE_SIZE = 20;
export function pageParams(sp: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  return { page, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

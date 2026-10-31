"use server";
import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { homeFor } from "@/lib/session";
import { emailLayout, sendMail } from "@/lib/mail";
import { forgotSchema, loginSchema, resetSchema, signupSchema } from "@/lib/validators/auth";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
  previewUrl?: string;
};

function fieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function signupAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } }))
    return { fieldErrors: { email: "An account with this email already exists" } };

  const user = await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role: "CUSTOMER" },
    });
    // Link to an existing customer record (created by staff) or create one.
    await tx.customer.upsert({
      where: { email },
      update: { userId: u.id },
      create: { name, email, userId: u.id },
    });
    return tx.user.findUniqueOrThrow({ where: { id: u.id }, include: { customer: true } });
  });

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId: user.customer?.id ?? null,
  });
  redirect(homeFor(user.role));
}

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email }, include: { customer: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Invalid email or password" };
  if (!user.isActive) return { error: "This account has been deactivated" };

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId: user.customer?.id ?? null,
  });
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homeFor(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const generic = "If an account exists for that email, a reset link is on its way.";

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { success: generic };

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  const res = await sendMail({
    to: user.email,
    subject: "Reset your Brightloop password",
    html: emailLayout(
      "Reset your password",
      `<p>Hi ${user.name},</p><p>Use the button below to choose a new password. The link expires in 1 hour.</p>
       <p><a href="${link}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset password</a></p>
       <p style="color:#71717a;font-size:12px">If you didn't ask for this, you can ignore this email.</p>`
    ),
  });
  return { success: generic, previewUrl: res.previewUrl };
}

export async function resetPasswordAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const rec = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date())
    return { error: "This reset link is invalid or has expired. Request a new one." };

  await db.$transaction([
    db.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
  return { success: "Password updated. You can sign in now." };
}

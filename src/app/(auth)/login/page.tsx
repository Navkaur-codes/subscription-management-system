import Link from "next/link";
import { AuthForm, AuthHeading } from "../auth-form";
import { loginAction } from "../actions";

export const metadata = { title: "Sign in" };

// Seeded demo accounts (prisma/seed.ts) — one click per role for evaluators.
const DEMO = [
  { label: "Admin", email: "admin@brightloop.test", password: "Brightloop@123" },
  { label: "Staff", email: "staff@brightloop.test", password: "Brightloop@123" },
  { label: "Customer", email: "customer@brightloop.test", password: "Brightloop@123" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <AuthHeading
        eyebrow="01 — Sign in"
        title={<>Welcome <em>back</em>.</>}
        subtitle="Pick up where the last billing cycle left off."
      />
      <AuthForm
        action={loginAction}
        hidden={next ? { next } : undefined}
        submitLabel="Sign in"
        demo={DEMO}
        fields={[
          { name: "email", label: "Email", type: "email", placeholder: "you@company.com", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        footer={
          <div className="grid gap-2">
            <Link href="/forgot-password" className="text-foreground underline-offset-4 hover:underline">
              Forgot password?
            </Link>
            <span>
              New to Brightloop?{" "}
              <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
                Create an account
              </Link>
            </span>
          </div>
        }
      />
    </>
  );
}

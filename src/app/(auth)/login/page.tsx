import Link from "next/link";
import { AuthForm, AuthHeading } from "../auth-form";
import { loginAction } from "../actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to your Brightloop account." />
      <AuthForm
        action={loginAction}
        hidden={next ? { next } : undefined}
        submitLabel="Sign in"
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

import Link from "next/link";
import { AuthForm, AuthHeading } from "../auth-form";
import { signupAction } from "../actions";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <AuthHeading
        eyebrow="02 — Create account"
        title={<>Start your <em>loop</em>.</>}
        subtitle="See every subscription, invoice and payment of yours in one place."
      />
      <AuthForm
        action={signupAction}
        submitLabel="Create account"
        fields={[
          { name: "name", label: "Full name", placeholder: "Asha Mehta", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", placeholder: "you@company.com", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
            hint: "More than 8 characters, with upper & lowercase and a special character.",
          },
          { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
        footer={
          <span>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </span>
        }
      />
    </>
  );
}

import Link from "next/link";
import { AuthForm, AuthHeading } from "../auth-form";
import { forgotPasswordAction } from "../actions";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Account recovery"
        title={<>Lost your <em>key</em>?</>}
        subtitle="We'll email a reset link to your registered address."
      />
      <AuthForm
        action={forgotPasswordAction}
        submitLabel="Send reset link"
        fields={[{ name: "email", label: "Email", type: "email", placeholder: "you@company.com", autoComplete: "email" }]}
        footer={
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        }
      />
    </>
  );
}

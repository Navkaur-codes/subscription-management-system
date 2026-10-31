import Link from "next/link";
import { AuthForm, AuthHeading } from "../auth-form";
import { resetPasswordAction } from "../actions";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token)
    return (
      <AuthHeading title="Invalid link" subtitle="This reset link is missing its token. Request a new one from the sign-in page." />
    );
  return (
    <>
      <AuthHeading title="Choose a new password" subtitle="Your new password must meet the same rules as sign-up." />
      <AuthForm
        action={resetPasswordAction}
        hidden={{ token }}
        submitLabel="Update password"
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            hint: "More than 8 characters, with upper & lowercase and a special character.",
          },
          { name: "confirmPassword", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
        footer={
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        }
      />
    </>
  );
}

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { hasBetterAuthConfig } from "@/lib/env";
import { buildMetadata } from "@/lib/site";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
    callbackURL?: string;
  }>;
};

export const metadata = buildMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Boring Squirrel account.",
  path: "/reset-password",
  noIndex: true,
});

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell py-16 sm:py-24">
      <ResetPasswordForm
        authEnabled={hasBetterAuthConfig()}
        token={params.token}
        error={params.error}
        callbackURL={params.callbackURL}
      />
    </main>
  );
}

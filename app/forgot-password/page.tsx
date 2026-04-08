import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { hasBetterAuthConfig, hasMailConfig } from "@/lib/env";
import { buildMetadata } from "@/lib/site";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    callbackURL?: string | string[];
  }>;
};

export const metadata = buildMetadata({
  title: "Forgot Password",
  description:
    "Request a password reset email for your Boring Squirrel account.",
  path: "/forgot-password",
  noIndex: true,
});

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const callbackURL =
    typeof params.callbackURL === "string" ? params.callbackURL : "/settings";

  return (
    <main className="page-shell py-16 sm:py-24">
      <ForgotPasswordForm
        authEnabled={hasBetterAuthConfig()}
        mailEnabled={hasMailConfig()}
        defaultEmail={email}
        callbackURL={callbackURL}
      />
    </main>
  );
}

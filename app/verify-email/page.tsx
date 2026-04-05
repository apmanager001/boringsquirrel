import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { hasBetterAuthConfig } from "@/lib/env";
import { buildMetadata } from "@/lib/site";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
    callbackURL?: string;
  }>;
};

export const metadata = buildMetadata({
  title: "Verify Email",
  description: "Verify your Boring Squirrel account email.",
  path: "/verify-email",
  noIndex: true,
});

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell py-16 sm:py-24">
      <VerifyEmailView
        authEnabled={hasBetterAuthConfig()}
        token={params.token}
        callbackURL={params.callbackURL}
      />
    </main>
  );
}

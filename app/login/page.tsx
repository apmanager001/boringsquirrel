import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthSession } from "@/lib/auth";
import {
  hasBetterAuthConfig,
  hasGoogleAuthConfig,
  hasMailConfig,
} from "@/lib/env";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Login",
  description: "Authentication for Boring Squirrel accounts.",
  path: "/login",
  noIndex: true,
});

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ callbackURL?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authEnabled = hasBetterAuthConfig();
  const googleEnabled = hasGoogleAuthConfig();
  const mailEnabled = hasMailConfig();
  const params = await searchParams;
  const callbackURL =
    typeof params.callbackURL === "string" ? params.callbackURL : "/settings";

  if (authEnabled) {
    const session = await getAuthSession();

    if (session?.user) {
      redirect(callbackURL);
    }

    return (
      <main className="page-shell py-14 sm:py-20">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start">
          <div className="space-y-6">
            <p className="section-kicker">Authentication</p>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Sign in with credentials now, with Google ready once the env
                values are present.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                The account layer now accepts real email or username logins and
                keeps the verified-email rule in place for likes and saved
                scores.
              </p>
            </div>

            <section className="grid gap-6 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="card-surface rounded-[1.6rem] p-6">
                <KeyRound className="size-5 text-primary" />
                <h2 className="display-font mt-4 text-2xl font-semibold">
                  Email or username
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/80">
                  Sign in with whichever identifier you remember best.
                </p>
              </div>
              <div className="card-surface rounded-[1.6rem] p-6">
                <MailCheck className="size-5 text-accent" />
                <h2 className="display-font mt-4 text-2xl font-semibold">
                  Verified before actions
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/80">
                  Verification is still required before social actions and saved
                  scores unlock.
                </p>
              </div>
              <div className="card-surface rounded-[1.6rem] p-6">
                <ShieldCheck className="size-5 text-secondary" />
                <h2 className="display-font mt-4 text-2xl font-semibold">
                  Manual admin promotion
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/80">
                  Your own account can be promoted in Mongo later without
                  changing the public signup flow.
                </p>
              </div>
            </section>
          </div>

          <LoginForm
            authEnabled={authEnabled}
            googleEnabled={googleEnabled}
            mailEnabled={mailEnabled}
            callbackURL={callbackURL}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start">
        <div className="space-y-6">
          <p className="section-kicker">Authentication</p>
          <div className="space-y-4">
            <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
              The login UI is ready, but auth env values are still missing here.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              Once Mongo, Better Auth, and SMTP values are present, this page
              will accept email or username logins and handle verification
              properly.
            </p>
          </div>
        </div>

        <LoginForm
          authEnabled={false}
          googleEnabled={false}
          mailEnabled={false}
          callbackURL={callbackURL}
        />
      </section>
    </main>
  );
}

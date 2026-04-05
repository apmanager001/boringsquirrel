import { MailCheck, ShieldCheck, UserRoundPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getAuthSession } from "@/lib/auth";
import {
  hasBetterAuthConfig,
  hasGoogleAuthConfig,
  hasMailConfig,
} from "@/lib/env";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Register",
  description:
    "Create a Boring Squirrel account with a unique username and verified email.",
  path: "/register",
  noIndex: true,
});

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams: Promise<{ callbackURL?: string | string[] }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
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
            <p className="section-kicker">Create account</p>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Register with a unique username and keep the verification rule
                intact.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                New accounts are normal users by default. Verified email unlocks
                blog likes, saved scores, and live leaderboard placement.
              </p>
            </div>

            <section className="grid gap-6 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="card-surface rounded-[1.6rem] p-6">
                <UserRoundPlus className="size-5 text-primary" />
                <h2 className="display-font mt-4 text-2xl font-semibold">
                  Unique usernames
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/80">
                  Availability is checked directly in the form before signup
                  completes.
                </p>
              </div>
              <div className="card-surface rounded-[1.6rem] p-6">
                <MailCheck className="size-5 text-accent" />
                <h2 className="display-font mt-4 text-2xl font-semibold">
                  Email verification
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/80">
                  Accounts can be created immediately, but protected actions
                  stay locked until verification.
                </p>
              </div>
              <div className="card-surface rounded-[1.6rem] p-6">
                <ShieldCheck className="size-5 text-secondary" />
                <h2 className="display-font mt-4 text-2xl font-semibold">
                  Future-ready auth
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/80">
                  Google OAuth can sit beside credentials without changing the
                  account rules.
                </p>
              </div>
            </section>
          </div>

          <RegisterForm
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
          <p className="section-kicker">Create account</p>
          <div className="space-y-4">
            <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
              The register UI is ready, but auth env values are still missing
              here.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              Once the auth and SMTP variables are set, this page will create
              real accounts and send live verification emails.
            </p>
          </div>
        </div>

        <RegisterForm
          authEnabled={false}
          googleEnabled={false}
          mailEnabled={false}
          callbackURL={callbackURL}
        />
      </section>
    </main>
  );
}

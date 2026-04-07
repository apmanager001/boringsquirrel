import { MailCheck, ShieldCheck, UserRoundPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import GameCards from "@/components/games/gameCards";
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

    const featureCards = [
      {
        id: "usernames",
        icon: UserRoundPlus,
        iconClassName: "text-primary",
        title: "Usernames",
        description:
          "Create your account with a unique username, email, or Google account.",
      },
      {
        id: "verify",
        icon: MailCheck,
        iconClassName: "text-accent",
        title: "Verify",
        description:
          "Verify your account in settings to save your scores and like blog posts.",
      },
      {
        id: "secure",
        icon: ShieldCheck,
        iconClassName: "text-secondary",
        title: "Secure",
        description:
          "We provide full security for all accounts",
      },
    ];

    return (
      <main className="page-shell py-14 sm:py-20">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-center">
          <div className="space-y-6">
            <p className="section-kicker">Create account</p>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Create your account
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                Use a unique username, email, and password. Display Name is
                optional.
              </p>
            </div>
            <div className="hidden sm:block">
              <GameCards items={featureCards} />
            </div>
          </div>

          <RegisterForm
            authEnabled={authEnabled}
            googleEnabled={googleEnabled}
            mailEnabled={mailEnabled}
            callbackURL={callbackURL}
          />
          <div className="block sm:hidden">
            <GameCards items={featureCards} />
          </div>
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
             Create Account
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              Possible server issues. Contact support if the problem persists.
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

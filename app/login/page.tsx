import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import GameCards from "@/components/games/gameCards";
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

    const featureCards = [
      {
        id: "Email",
        icon: KeyRound,
        iconClassName: "text-primary",
        title: "Email or username",
        description:
          "Sign in with either your Google, email, or username.",
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
            <p className="section-kicker">Sign In</p>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Sign into your account
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                Sign in with your email or username and password, or use Google for a quicker login.
              </p>
            </div>
            <div className="hidden sm:block">
              <GameCards items={featureCards} />
            </div>
          </div>

          <LoginForm
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
          <p className="section-kicker">Sign In</p>
          <div className="space-y-4">
            <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
              Sign into your account
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              Possible server issues. Contact support if the problem persists.
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

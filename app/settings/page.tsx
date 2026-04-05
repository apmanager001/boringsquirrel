import { redirect } from "next/navigation";
import { BellDot, MailCheck, UserRound, Heart } from "lucide-react";
import Link from "next/link";
import { getAuthSession, getSessionIdentityFromUnknown } from "@/lib/auth";
import { hasBetterAuthConfig } from "@/lib/env";
import { getUserLikedPostCount } from "@/lib/blog-likes";
import { getUserProfileSocialLinks } from "@/lib/profiles";
import { buildMetadata } from "@/lib/site";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileSocialLinksForm } from "@/components/settings/profile-social-links-form";
import { ProfileUsernameForm } from "@/components/settings/profile-username-form";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Settings",
  description: "User settings for Boring Squirrel accounts.",
  path: "/settings",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasBetterAuthConfig()) {
    return (
      <main className="page-shell py-14 sm:py-20">
        <section className="space-y-6">
          <p className="section-kicker">Settings</p>
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Authentication needs env setup before the real settings view can
            load.
          </h1>
        </section>
      </main>
    );
  }

  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const identity = getSessionIdentityFromUnknown(session.user);

  if (!identity) {
    redirect("/login");
  }

  const [likedPostCount, socialLinks] = await Promise.all([
    getUserLikedPostCount(identity.userId),
    getUserProfileSocialLinks(identity.userId),
  ]);

  const username = identity.username;
  const displayName = identity.displayName;

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="section-kicker">Settings</p>
          <SignOutButton />
        </div>
        <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
          Account preferences
        </h1>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card-surface rounded-[1.6rem] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-primary" />
              <h2 className="display-font text-2xl font-semibold">
                Profile settings
              </h2>
            </div>
            <Image
              src={session.user.image || "/default-avatar.png"}
              alt="User avatar"
              width={48}
              height={48}
              className="rounded-full border border-base-300/20 bg-white/50 object-cover"
            />
          </div>
          <ProfileUsernameForm username={username} displayName={displayName} />
          <Link
            href={`/profile/${identity.userId}`}
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:text-primary/80"
          >
            View public profile
          </Link>
        </div>
        <div className="card-surface rounded-[1.6rem] p-6">
          <div className="flex items-center gap-3">
            <MailCheck className="size-5 text-accent" />
            <h2 className="display-font text-2xl font-semibold">
              Email settings
            </h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-base-content/80">
            {session.user.email} is{" "}
            {session.user.emailVerified ? "verified" : "not verified yet"}.
          </p>
        </div>
        <div className="card-surface rounded-[1.6rem] p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <BellDot className="size-5 text-secondary" />
            <h2 className="display-font text-2xl font-semibold">
              Notification defaults
            </h2>
          </div>
          <p className="mt-3 text-sm leading-7 text-base-content/80">
            New-post emails are still planned to default to enabled. This panel
            is now protected behind a real session so the persistence layer can
            be added directly on top.
          </p>
        </div>
        <ProfileSocialLinksForm
          steamHandle={socialLinks.steamHandle}
          discordHandle={socialLinks.discordHandle}
          xboxHandle={socialLinks.xboxHandle}
          playstationHandle={socialLinks.playstationHandle}
          twitchHandle={socialLinks.twitchHandle}
        />
        <div className="card-surface rounded-[1.8rem] p-6">
          <div className="flex items-center gap-3">
            <Heart className="size-5 text-accent" />
            <h2 className="display-font text-2xl font-semibold">Blog likes</h2>
          </div>
          <p className="display-font mt-4 text-5xl font-semibold text-base-content">
            {likedPostCount}
          </p>
          <p className="mt-3 text-sm leading-7 text-base-content/78">
            Verified reactions are now counted once per account and feed the
            post popularity views across the site.
          </p>
        </div>
      </section>
    </main>
  );
}

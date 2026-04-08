import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Trophy, UserRound } from "lucide-react";
import { ProfileReportFlag } from "@/components/profile/profile-report-flag";
import { ProfileSocialHandles } from "@/components/profile/profile-social-handles";
import {
  buildGamePlayHref,
  formatDailyPuzzleDate,
  parseScoreKey,
} from "@/lib/games/daily";
import { formatGameScoreDetails } from "@/lib/games/score-formatting";
import { getPublicProfileById } from "@/lib/profiles";
import { buildMetadata, formatDate, getGameBySlug } from "@/lib/site";

type PublicProfilePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfileById(id);
  const path = `/profile/${encodeURIComponent(id)}`;

  if (!profile) {
    return buildMetadata({
      title: "Profile not found",
      description: "This Boring Squirrel profile could not be found.",
      path,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `@${profile.username}`,
    description: `Public profile for @${profile.username} on Boring Squirrel.`,
    path,
    noIndex: true,
  });
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { id } = await params;
  const profile = await getPublicProfileById(id);

  if (!profile) {
    notFound();
  }

  const topScore = profile.savedScores.reduce(
    (best, savedScore) => Math.max(best, savedScore.score),
    0,
  );
  const hasDistinctDisplayName =
    profile.displayName.toLowerCase() !== profile.username.toLowerCase();
  const sharedAccounts = [
    {
      label: "Steam",
      handle: profile.socialLinks.steamHandle,
      icon: "/socialIcons/steam.svg",
    },
    {
      label: "Discord",
      handle: profile.socialLinks.discordHandle,
      icon: "/socialIcons/discord.svg",
    },
    {
      label: "Xbox",
      handle: profile.socialLinks.xboxHandle,
      icon: "/socialIcons/xbox.svg",
    },
    {
      label: "PlayStation",
      handle: profile.socialLinks.playstationHandle,
      icon: "/socialIcons/playstation.svg",
    },
    {
      label: "Twitch",
      handle: profile.socialLinks.twitchHandle,
      icon: "/socialIcons/twitch.svg",
    },
  ].filter((account) => account.handle.length > 0);

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Public profile</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-base-content/70">
            <UserRound className="size-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-[0.22em]">
              Profile
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
              {profile.username}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              {hasDistinctDisplayName
                ? `${profile.displayName} keeps their best verified runs here.`
                : "Best verified runs saved across the game catalog live here."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card-surface rounded-[1.8rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker before:w-6">Saved scores</p>
              <h2 className="display-font mt-3 text-3xl font-semibold">
                Best scores
              </h2>
            </div>
            <Trophy className="size-6 text-secondary" />
          </div>

          {profile.savedScores.length === 0 ? (
            <p className="mt-5 text-sm leading-7 text-base-content/75">
              No verified scores have been saved for this account yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {profile.savedScores.map((savedScore) => {
                const game = getGameBySlug(savedScore.gameSlug);
                const scoreScope = parseScoreKey(savedScore.scoreKey);
                const gameHref = buildGamePlayHref(savedScore.gameSlug, {
                  mode: scoreScope.mode,
                  dayKey: scoreScope.dayKey,
                });
                const scoreLabel =
                  scoreScope.mode === "daily"
                    ? `${game?.name ?? savedScore.gameSlug} daily`
                    : (game?.name ?? savedScore.gameSlug);
                const detailText = formatGameScoreDetails(
                  savedScore.gameSlug,
                  savedScore.details,
                );

                return (
                  <Link
                    key={`${savedScore.gameSlug}-${savedScore.scoreKey}`}
                    href={gameHref}
                    className="rounded-[1.4rem] border border-base-300/15 bg-white/45 p-4 transition hover:border-base-300/30 hover:bg-white/60"
                  >
                    <p className="section-kicker before:w-5">{scoreLabel}</p>
                    <p className="display-font mt-3 text-4xl font-semibold text-base-content">
                      {savedScore.score}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-base-content/75">
                      {detailText || "Verified score saved for this game."}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-base-content/45">
                      {scoreScope.mode === "daily" && scoreScope.dayKey
                        ? `Puzzle ${formatDailyPuzzleDate(scoreScope.dayKey)} · `
                        : ""}
                      Updated {formatDate(savedScore.updatedAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-surface rounded-[1.8rem] p-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="size-5 text-primary" />
              <h2 className="display-font text-2xl font-semibold">
                Profile summary
              </h2>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-base-content/78">
              <div className="flex items-center justify-between gap-4">
                <span>Username</span>
                <span className="font-semibold text-base-content">
                  {profile.username}
                </span>
              </div>
              {hasDistinctDisplayName ? (
                <div className="flex items-center justify-between gap-4">
                  <span>Display name</span>
                  <span className="font-semibold text-base-content">
                    {profile.displayName}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span>Saved bests</span>
                <span className="font-semibold text-base-content">
                  {profile.savedScores.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Top score</span>
                <span className="font-semibold text-base-content">
                  {topScore}
                </span>
              </div>
            </div>
          </div>

          {sharedAccounts.length > 0 ? (
            <div className="card-surface rounded-[1.8rem] p-6">
              <p className="section-kicker before:w-6">Shared accounts</p>
              <p className="mt-4 text-sm leading-7 text-base-content/78">
                Copy a screen name below and use it on the platform directly.
              </p>
              <ProfileSocialHandles accounts={sharedAccounts} />
            </div>
          ) : null}

          <ProfileReportFlag userId={profile.userId} />

          <div className="card-surface rounded-[1.8rem] p-6">
            <p className="section-kicker before:w-6">Next moves</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-base-content/78">
              <p>Jump into the games and try to beat the runs on this page.</p>
              <p>
                Every verified save updates the player&apos;s best run for that
                game or that day&apos;s shared puzzle.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/games" className="btn btn-primary rounded-full">
                Play games
              </Link>
              <Link href="/settings" className="btn btn-secondary rounded-full">
                Account settings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

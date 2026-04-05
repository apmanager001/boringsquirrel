import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Spotlight, Sparkles, Gamepad2 } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { PostCard } from "@/components/post-card";
import { getPopularPosts, getRecentPosts } from "@/lib/blog";
import { formatGameScoreDetails } from "@/lib/games/score-formatting";
import {
  getGameLeaderboard,
  type SupportedScoreGameSlug,
} from "@/lib/game-scores";
import { buildMetadata, gameCatalog, getGameBySlug } from "@/lib/site";

const homepageLeaderboardGameSlugs: SupportedScoreGameSlug[] = [
  "sudoku",
  "oilcap",
  "acornsweeper",
];

type HomeLeaderboardSection = {
  game: NonNullable<ReturnType<typeof getGameBySlug>>;
  scoreboard: Awaited<ReturnType<typeof getGameLeaderboard>>;
};

export const metadata = buildMetadata({
  title: "Browser Games and Build Notes",
  description:
    "Boring Squirrel blends SEO-focused blog content with browser games you can play without signing in.",
  path: "/",
  keywords: [
    "browser games",
    "indie web games",
    "SEO blog",
    "sudoku online",
    "puzzle build notes",
  ],
});

export const dynamic = "force-dynamic";

export default async function Home() {
  const [topLikedPosts, latestPosts, leaderboardSections] = await Promise.all([
    getPopularPosts(2),
    getRecentPosts(3),
    Promise.all(
      homepageLeaderboardGameSlugs.map(async (slug) => {
        const game = getGameBySlug(slug);

        if (!game) {
          return null;
        }

        return {
          game,
          scoreboard: await getGameLeaderboard(slug, 5),
        };
      }),
    ),
  ]);

  const homeLeaderboardSections = leaderboardSections.filter(
    (section): section is HomeLeaderboardSection => Boolean(section),
  );

  return (
    <main className="pb-16 sm:pb-24">
      <section className="page-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-center">
        <div className="space-y-8">
          {/* <p className="section-kicker">Launch phase</p> */}
          <div className="space-y-5">
            <h1 className="display-font max-w-4xl text-5xl font-bold leading-[0.95] text-base-content sm:text-6xl lg:text-7xl">
              Welcome to Boring Squirrel
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-base-content/80 sm:text-xl">
              Play small, strange, and satisfying games built right here, then
              dive into posts about game design, media, and whatever else the
              squirrel drags in.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/games" className="btn btn-primary rounded-full px-6">
              Explore games
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/blog" className="btn btn-secondary rounded-full px-6">
              Read the blog
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface rounded-3xl p-5">
              <Sparkles className="size-5 text-primary" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-base-content/60">
                Blog
              </p>
              <p className="mt-2 text-sm leading-7 text-base-content/78">
                Read about games, tech and everything interesting. Like posts
                you find interetsing.
              </p>
            </div>
            <div className="card-surface rounded-3xl p-5">
              <Gamepad2 className="size-5 text-accent" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-base-content/60">
                Games
              </p>
              <p className="mt-2 text-sm leading-7 text-base-content/78">
                Play games for free, no account required. Play classic games and
                puzzles.
              </p>
            </div>
            <div className="card-surface rounded-3xl p-5">
              <Spotlight className="size-5 text-secondary" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-base-content/60">
                Leaderboard
              </p>
              <p className="mt-2 text-sm leading-7 text-base-content/78">
                Verified accounts can now save best runs and climb the live game
                leaderboards.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="hero-orb absolute -left-6 top-10 size-24 rounded-full bg-primary/25 blur-2xl" />
          <div className="hero-orb absolute right-6 top-0 size-28 rounded-full bg-accent/25 blur-2xl" />
          <div className="hero-orb absolute bottom-6 left-14 size-20 rounded-full bg-secondary/25 blur-2xl" />

          <div className="card-surface relative overflow-hidden rounded-4xl p-4 sm:p-5">
            <div className="relative aspect-4/5 overflow-hidden rounded-4xl bg-base-200/20">
              <Image
                src="/squirrelglasses.webp"
                alt="Boring Squirrel logo"
                fill
                sizes="(max-width: 1024px) 100vw, 30rem"
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 rounded-b-4xl bg-linear-to-t from-black/65 via-black/10 to-transparent p-6 text-white">
              <p className="text-sm uppercase tracking-[0.22em] text-white/75">
                Boring Squirrel
              </p>
              <p className="mt-3 max-w-md text-base leading-7 text-white/85">
                The visual identity is playful. The information architecture is
                serious.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell mt-10 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="section-kicker">Top liked posts</p>
            <h2 className="display-font text-4xl font-semibold text-base-content">
              Posts worth opening first
            </h2>
          </div>
          <Link href="/blog/popular" className="btn btn-secondary rounded-full">
            Browse all posts
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {topLikedPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="page-shell mt-16 space-y-6">
        <div className="space-y-3">
          <p className="section-kicker">Games section</p>
          <h2 className="display-font text-4xl font-semibold text-base-content">
            Guest-playable games with verified scoreboards live
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {gameCatalog.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section className="page-shell mt-16 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="section-kicker">Leaderboard preview</p>
            <h2 className="display-font text-4xl font-semibold text-base-content">
              Top 5
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-base-content/78 sm:text-base">
              Can you climb higher? Every score on the leaderboard is a verified
              user.
            </p>
          </div>
          <Link href="/leaderboard" className="btn btn-secondary rounded-full">
            Full leaderboard
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {homeLeaderboardSections.map(({ game, scoreboard }) => (
            <article
              key={game.slug}
              className="card-surface rounded-[1.8rem] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-kicker before:w-5">{game.name}</p>
                  <h3 className="display-font mt-3 text-2xl font-semibold text-base-content">
                    Top 5 players
                  </h3>
                </div>
                <Spotlight className="mt-1 size-5 text-secondary" />
              </div>

              {!scoreboard.available ? (
                <div className="mt-5 rounded-[1.4rem] border border-base-300/15 bg-white/45 px-4 py-3 text-sm leading-7 text-base-content/78">
                  Scores are unavailable right now.
                </div>
              ) : scoreboard.leaderboard.length === 0 ? (
                <div className="mt-5 rounded-[1.4rem] border border-base-300/15 bg-white/45 px-4 py-3 text-sm leading-7 text-base-content/78">
                  No verified scores saved yet.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {scoreboard.leaderboard.map((entry) => {
                    const detailText = formatGameScoreDetails(
                      game.slug,
                      entry.details,
                    );

                    return (
                      <div
                        key={`${game.slug}-${entry.userId}`}
                        className="rounded-[1.3rem] border border-base-300/15 bg-white/45 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-base-content/45">
                              #{entry.rank}
                            </p>
                            <Link
                              href={`/profile/${encodeURIComponent(entry.userId)}`}
                              className="mt-2 block truncate font-semibold text-base-content transition hover:text-primary"
                            >
                              {entry.username}
                            </Link>
                            <p className="mt-1 text-sm leading-6 text-base-content/72">
                              {detailText || "Verified score on file."}
                            </p>
                          </div>

                          <p className="display-font text-3xl font-semibold text-base-content">
                            {entry.score}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="section-kicker">Recent posts</p>
            <h2 className="display-font text-4xl font-semibold text-base-content">
              Fresh build notes and launch updates
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>

        <aside className="card-surface rounded-[1.8rem] p-6 lg:sticky lg:top-28">
          <p className="section-kicker before:w-6">Stay close</p>
          <h2 className="display-font mt-4 text-3xl font-semibold">
            Contact and updates
          </h2>
          <p className="mt-4 text-sm leading-7 text-base-content/80">
            Need to reach out? The contact page is open for messages about the
            games, the blog, or anything else on your mind.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-primary rounded-full">
              Open contact page
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

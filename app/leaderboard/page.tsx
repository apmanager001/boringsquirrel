import Link from "next/link";
import { Trophy } from "lucide-react";
import { formatGameScoreDetails } from "@/lib/games/score-formatting";
import {
  getGameLeaderboard,
  type SupportedScoreGameSlug,
} from "@/lib/game-scores";
import { buildMetadata, formatDate, getGameBySlug } from "@/lib/site";

const leaderboardGameSlugs: SupportedScoreGameSlug[] = [
  "sudoku",
  "wordle",
  "waffle",
  "word-search",
  "oilcap",
  "acornsweeper",
];

type LeaderboardSection = {
  game: NonNullable<ReturnType<typeof getGameBySlug>>;
  scoreboard: Awaited<ReturnType<typeof getGameLeaderboard>>;
};

export const metadata = buildMetadata({
  title: "Leaderboard",
  description:
    "See the top verified scores for every Boring Squirrel game and jump straight into each player's public profile.",
  path: "/leaderboard",
  keywords: [
    "game leaderboard",
    "top scores",
    "sudoku leaderboard",
    "wordle leaderboard",
    "word search leaderboard",
    "oilcap leaderboard",
    "browser game rankings",
  ],
});

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboardSections = (
    await Promise.all(
      leaderboardGameSlugs.map(async (slug) => {
        const game = getGameBySlug(slug);

        if (!game) {
          return null;
        }

        return {
          game,
          scoreboard: await getGameLeaderboard(slug, 10),
        };
      }),
    )
  ).filter((section): section is LeaderboardSection => Boolean(section));

  return (
    <main className="page-shell py-6 md:py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Leaderboard</p>
        <div className="space-y-4">
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Leaderboard
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-base-content/80">
            Every score is saved from a verified account. Check out your
            competition, or jump into a game and try to take a higher spot.
          </p>
        </div>
      </section>

      <section className="mt-4 md:mt-12 grid gap-6">
        {leaderboardSections.map(({ game, scoreboard }) => (
          <article
            key={game.slug}
            className="card-surface min-w-0 rounded-[1.8rem] p-6 sm:p-7"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="section-kicker before:w-5">{game.name}</p>
                <h2 className="display-font mt-3 text-3xl font-semibold text-base-content">
                  Leaderboard
                </h2>
                <p className="mt-3 text-sm leading-7 text-base-content/78">
                  {game.scoreHook}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <Trophy className="size-4" />
                  {game.status}
                </div>
                <Link
                  href={`/games/${game.slug}`}
                  className="btn btn-secondary rounded-full"
                >
                  Play {game.name}
                </Link>
              </div>
            </div>

            {!scoreboard.available ? (
              <div className="mt-6 rounded-[1.4rem] border border-base-300/15 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/78">
                Score saving is unavailable right now, so this table cannot be
                loaded.
              </div>
            ) : scoreboard.leaderboard.length === 0 ? (
              <div className="mt-6 rounded-[1.4rem] border border-base-300/15 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/78">
                No verified scores have been saved for {game.name} yet.
              </div>
            ) : (
              <div className="mt-6 max-w-full overflow-x-auto rounded-[1.4rem] border border-base-300/15 bg-white/45">
                <table className="w-full min-w-160 border-separate border-spacing-0 md:min-w-176">
                  <thead>
                    <tr>
                      <th className="border-b border-base-300/15 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-base-content/45">
                        Rank
                      </th>
                      <th className="border-b border-base-300/15 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-base-content/45">
                        Username
                      </th>
                      <th className="border-b border-base-300/15 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-base-content/45">
                        Details
                      </th>
                      <th className="border-b border-base-300/15 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.24em] text-base-content/45">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreboard.leaderboard.map((entry) => {
                      const detailText = formatGameScoreDetails(
                        game.slug,
                        entry.details,
                      );
                      //   const hasDistinctDisplayName =
                      //     entry.displayName.length > 0 &&
                      //     entry.displayName.toLowerCase() !==
                      //       entry.username.toLowerCase();

                      return (
                        <tr key={`${game.slug}-${entry.userId}`}>
                          <td className="border-b border-base-300/12 px-4 py-4 text-sm font-semibold text-base-content/65 last:border-b-0">
                            #{entry.rank}
                          </td>
                          <td className="border-b border-base-300/12 px-4 py-4  last:border-b-0">
                            <Link
                              href={`/profile/${encodeURIComponent(entry.userId)}`}
                              className="font-semibold text-base-content transition hover:text-primary"
                            >
                              {entry.username}
                            </Link>
                            {/* {hasDistinctDisplayName ? (
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-base-content/45">
                                {entry.displayName}
                              </p>
                            ) : null} */}
                          </td>
                          <td className="border-b border-base-300/12 px-4 py-4 text-sm leading-7 text-base-content/75 last:border-b-0">
                            <p>{detailText || "Verified score on file."}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-base-content/45">
                              Updated {formatDate(entry.updatedAt)}
                            </p>
                          </td>
                          <td className="border-b border-base-300/12 px-4 py-4 text-right align-top last:border-b-0">
                            <span className="display-font text-3xl font-semibold text-base-content">
                              {entry.score}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

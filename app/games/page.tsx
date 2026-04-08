import { GameCard } from "@/components/game-card";
import { buildMetadata, gameCatalog } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Games",
  description:
    "Explore browser games from Boring Squirrel, including Sudoku, Wordle, Waffle, Word Search, Oilcap, and AcornSweeper.",
  path: "/games",
  keywords: [
    "browser games",
    "sudoku",
    "wordle",
    "waffle",
    "word search",
    "pipe game",
    "minesweeper",
    "web puzzles",
  ],
});

export default function GamesPage() {
  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Games hub</p>
        <div className="space-y-4">
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Free Games no need to login unless you want to save your scores.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-base-content/80">
            Log in to save your scores and compete on the leaderboards, or play
            as a guest for instant fun. All games are designed to be accessible
            and enjoyable without an account, so jump in and start playing right
            away.
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        {gameCatalog.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </section>
    </main>
  );
}

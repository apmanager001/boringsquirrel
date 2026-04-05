import { BrainCircuit, Keyboard, Trophy } from "lucide-react";
import { SudokuGameShell } from "@/components/games/sudoku-game-shell";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("sudoku");

export const metadata = buildMetadata({
  title: "Sudoku",
  description: game?.longDescription,
  path: "/games/sudoku",
  image: game?.heroImage,
  keywords: game?.keywords,
});

export default function SudokuPage() {
  if (!game) {
    return null;
  }

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid gap-8 xl:items-start">
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <p className="section-kicker">{game.eyebrow}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  <BrainCircuit className="size-4" />
                  {game.status}
              </div>
            </div>
            <div className="space-y-4">
              
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Classic Sudoku
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {game.longDescription}
              </p>
            </div>
          </div>

          <section className="grid gap-6 sm:grid-cols-3">
            <div className="card-surface rounded-[1.6rem] p-6">
              <BrainCircuit className="size-5 text-primary" />
              <h2 className="display-font mt-4 text-2xl font-semibold">
                Generated boards
              </h2>
              <p className="mt-3 text-sm leading-7 text-base-content/80">
                Easy, medium, and hard each generate from a fresh solved grid
                and then remove clues while preserving a unique answer.
              </p>
            </div>
            <div className="card-surface rounded-[1.6rem] p-6">
              <Keyboard className="size-5 text-accent" />
              <h2 className="display-font mt-4 text-2xl font-semibold">
                Keyboard and mobile input
              </h2>
              <p className="mt-3 text-sm leading-7 text-base-content/80">
                Arrow keys, number keys, and pencil mode are wired in, while the
                on-screen pad keeps the board usable on phones.
              </p>
            </div>
            <div className="card-surface rounded-[1.6rem] p-6">
              <Trophy className="size-5 text-secondary" />
              <h2 className="display-font mt-4 text-2xl font-semibold">
                Solve-for-score
              </h2>
              <p className="mt-3 text-sm leading-7 text-base-content/80">
                Faster finishes and fewer mistakes keep more of the score intact
                so verified accounts can bank better runs on the leaderboard.
              </p>
            </div>
          </section>

          <section className="card-surface rounded-[1.8rem] p-6 sm:p-7">
            <p className="section-kicker before:w-5">How it scores</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-base-content/78">
              <p>{game.scoreHook}</p>
              <p>
                Each difficulty has its own clue target, base score, and pace
                expectation. Wrong entries are rejected immediately and count as
                mistakes so accuracy stays central to the run.
              </p>
            </div>
          </section>
        </div>

        <SudokuGameShell />
      </section>
    </main>
  );
}

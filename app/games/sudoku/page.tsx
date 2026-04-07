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

export const dynamic = "force-dynamic";

export default function SudokuPage() {
  if (!game) {
    return null;
  }

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid sm:gap-8 xl:items-start">
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

          <section className="grid gap-2.5 sm:gap-6 sm:grid-cols-3">
            <div className="card-surface grid grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1.5 rounded-[1.15rem] p-3 sm:block sm:rounded-[1.6rem] sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <BrainCircuit className="size-3.5 shrink-0 text-primary sm:size-5" />
                <h2 className="display-font text-base font-semibold leading-snug sm:text-2xl">
                  Generated boards
                </h2>
              </div>
              <p className="col-span-2 text-[11px] leading-5 text-base-content/80 sm:mt-3 sm:text-sm sm:leading-7">
                Easy, medium, and hard each generate from a fresh solved grid
                and then remove clues while preserving a unique answer.
              </p>
            </div>
            <div className="card-surface grid grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1.5 rounded-[1.15rem] p-3 sm:block sm:rounded-[1.6rem] sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Keyboard className="size-3.5 shrink-0 text-accent sm:size-5" />
                <h2 className="display-font text-base font-semibold leading-snug sm:text-2xl">
                  Keyboard and mobile input
                </h2>
              </div>
              <p className="col-span-2 text-[11px] leading-5 text-base-content/80 sm:mt-3 sm:text-sm sm:leading-7">
                Arrow keys, number keys, and pencil mode are wired in, while the
                on-screen pad keeps the board usable on phones.
              </p>
            </div>
            <div className="card-surface grid grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1.5 rounded-[1.15rem] p-3 sm:block sm:rounded-[1.6rem] sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="size-3.5 shrink-0 text-secondary sm:size-5" />
                <h2 className="display-font text-base font-semibold leading-snug sm:mt-auto sm:text-2xl">
                  Solve-for-score
                </h2>
              </div>
              <p className="col-span-2 text-[11px] leading-5 text-base-content/80 sm:mt-3 sm:text-sm sm:leading-7">
                Faster finishes and fewer mistakes keep more of the score intact
                so verified accounts can bank better runs on the leaderboard.
              </p>
            </div>
          </section>

          <section className="hidden sm:block card-surface rounded-[1.8rem] sm:p-7">
            <p className="section-kicker before:w-5">How it scores</p>
            <div className="sm:mt-4 space-y-3 text-sm leading-7 text-base-content/78">
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

import { BrainCircuit, Keyboard, Trophy } from "lucide-react";
import GameCards from "@/components/games/gameCards";
import { SudokuGameShell } from "@/components/games/sudoku-game-shell";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("sudoku");
const featureCards = [
  {
    id: "generated-boards",
    icon: BrainCircuit,
    iconClassName: "text-primary",
    title: "Generated boards",
    description:
      "Easy, medium, and hard each generate from a fresh solved grid and then remove clues while preserving a unique answer.",
  },
  {
    id: "keyboard-mobile-input",
    icon: Keyboard,
    iconClassName: "text-accent",
    title: "Keyboard and mobile input",
    description:
      "Arrow keys, number keys, and pencil mode are wired in, while the on-screen pad keeps the board usable on phones.",
  },
  {
    id: "solve-for-score",
    icon: Trophy,
    iconClassName: "text-secondary",
    title: "Solve-for-score",
    description:
      "Faster finishes and fewer mistakes keep more of the score intact so verified accounts can bank better runs on the leaderboard.",
  },
];

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

          <GameCards items={featureCards} />

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

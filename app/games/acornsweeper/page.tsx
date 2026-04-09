import { Nut, Squirrel, Trophy } from "lucide-react";
import GameCards from "@/components/games/gameCards";
import { AcornSweeperGameShell } from "@/components/games/acornsweeper/acornsweeper-game-shell";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("acornsweeper");
const featureCards = [
  {
    id: "hidden-acorns",
    icon: Nut,
    iconClassName: "text-primary",
    title: "Hidden acorns",
    description:
      "Every board hides a fresh spread of acorns. The first reveal is protected so you can open a safe pocket and start reading the numbers immediately.",
  },
  {
    id: "squirrel-flags",
    icon: Squirrel,
    iconClassName: "text-accent",
    title: "Squirrel flags",
    description:
      "Right-click plants a squirrel on hidden danger, and touch users can flip into flag mode before tapping the board.",
  },
  {
    id: "clear-for-score",
    icon: Trophy,
    iconClassName: "text-secondary",
    title: "Clear-for-score",
    description:
      "Each difficulty has its own base score and pace target. Finish faster to keep more of that score intact for the leaderboard.",
  },
];

export const metadata = buildMetadata({
  title: "AcornSweeper",
  description: game?.longDescription,
  path: "/games/acornsweeper",
  image: game?.heroImage,
  keywords: game?.keywords,
});

export default function AcornSweeperPage() {
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
                <Nut className="size-4" />
                {game.status}
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Sweep the field, mark the acorns, and save the cleanest clears.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {game.longDescription}
              </p>
            </div>
          </div>

          <GameCards items={featureCards} />

          <section className="hidden sm:block card-surface rounded-[1.8rem] p-6 sm:p-7">
            <p className="section-kicker before:w-5">How it scores</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-base-content/78">
              <p>{game.scoreHook}</p>
              <p>
                Easy, medium, and hard all share the same rules: reveal every
                safe square, avoid detonating a hidden acorn, and only solved
                fields can be saved as verified best runs.
              </p>
            </div>
          </section>
        </div>

        <AcornSweeperGameShell />
      </section>
    </main>
  );
}

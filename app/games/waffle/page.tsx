import Link from "next/link";
import { CalendarDays, Grid3x3, Shuffle, Trophy } from "lucide-react";
import GameCards from "@/components/games/gameCards";
import { WaffleGameShell } from "@/components/games/waffle-game-shell";
import {
  buildGamePlayHref,
  formatDailyPuzzleDate,
  normalizeDayKey,
  parsePuzzlePlayMode,
} from "@/lib/games/daily";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("waffle");
const featureCards = [
  {
    id: "crossing-words",
    icon: Grid3x3,
    iconClassName: "text-primary",
    title: "Six crossings",
    description:
      "Every board is built from six crossing five-letter words pulled from the shared bank, so the grid always resolves into real entries.",
  },
  {
    id: "controlled-shuffle",
    icon: Shuffle,
    iconClassName: "text-accent",
    title: "Controlled shuffle",
    description:
      "The opening layout is created from a real solved board using a short swap chain, which keeps every puzzle within reach of the move budget.",
  },
  {
    id: "swap-bonus",
    icon: Trophy,
    iconClassName: "text-secondary",
    title: "Swap bonus",
    description:
      "The more swaps you keep in reserve, the stronger the verified score you can save to the leaderboard.",
  },
];

export const metadata = buildMetadata({
  title: "Waffle",
  description: game?.longDescription,
  path: "/games/waffle",
  image: game?.heroImage,
  keywords: game?.keywords,
});

export const dynamic = "force-dynamic";

type WafflePageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    day?: string | string[];
  }>;
};

export default async function WafflePage({ searchParams }: WafflePageProps) {
  if (!game) {
    return null;
  }

  const params = await searchParams;
  const mode = parsePuzzlePlayMode(params.mode);
  const dayKey = mode === "daily" ? normalizeDayKey(params.day) : null;
  const dailyLabel = dayKey ? formatDailyPuzzleDate(dayKey) : null;
  const classicHref = buildGamePlayHref("waffle");
  const dailyHref = buildGamePlayHref("waffle", {
    mode: "daily",
    dayKey,
  });

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid sm:gap-8 xl:items-start">
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <p className="section-kicker">{game.eyebrow}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {mode === "daily" ? (
                  <CalendarDays className="size-4" />
                ) : (
                  <Shuffle className="size-4" />
                )}
                {mode === "daily" && dailyLabel
                  ? `Daily · ${dailyLabel}`
                  : game.status}
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                {mode === "daily"
                  ? "Everyone untangles the same six crossings today."
                  : "Swap letters into six clean crossings before the move budget runs out."}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {mode === "daily"
                  ? "Daily Waffle gives every player the same shuffled grid for the same date. Solve it with swaps left in reserve if you want a stronger spot on that shared board."
                  : game.longDescription}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={classicHref}
                  className={`btn rounded-full ${
                    mode === "classic" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Classic board
                </Link>
                <Link
                  href={dailyHref}
                  className={`btn rounded-full ${
                    mode === "daily" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  Daily board
                </Link>
              </div>
            </div>
          </div>

          <GameCards items={featureCards} />

          <section className="hidden sm:block card-surface rounded-[1.8rem] p-6 sm:p-7">
            <p className="section-kicker before:w-5">How it scores</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-base-content/78">
              <p>{game.scoreHook}</p>
              <p>
                {mode === "daily"
                  ? "Daily saves only compare against this date-specific grid, so every verified run is solving the same crossings and the same scramble."
                  : "Every completed board starts from a time-based core score, then adds a bonus for each unused swap. Only solved waffles can be saved."}
              </p>
            </div>
          </section>
        </div>

        <WaffleGameShell mode={mode} dayKey={dayKey ?? undefined} />
      </section>
    </main>
  );
}

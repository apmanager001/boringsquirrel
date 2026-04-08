import Link from "next/link";
import { CalendarDays, Route, Search, Trophy } from "lucide-react";
import GameCards from "@/components/games/gameCards";
import { WordSearchGameShell } from "@/components/games/word-search-game-shell";
import {
  buildGamePlayHref,
  formatDailyPuzzleDate,
  normalizeDayKey,
  parsePuzzlePlayMode,
} from "@/lib/games/daily";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("word-search");
const featureCards = [
  {
    id: "shared-grid-words",
    icon: Search,
    iconClassName: "text-primary",
    title: "Shared grid words",
    description:
      "Target words come from the shared editable bank, so expanding the word search pool later only requires updating one file.",
  },
  {
    id: "drag-lines",
    icon: Route,
    iconClassName: "text-accent",
    title: "Drag the line",
    description:
      "Words can be traced horizontally, vertically, or diagonally, with reverse lines still counting when they match the target entry.",
  },
  {
    id: "accuracy-scoring",
    icon: Trophy,
    iconClassName: "text-secondary",
    title: "Accuracy scoring",
    description:
      "Fast clears matter, but false lines chip away at the score before a verified run hits the leaderboard.",
  },
];

export const metadata = buildMetadata({
  title: "Word Search",
  description: game?.longDescription,
  path: "/games/word-search",
  image: game?.heroImage,
  keywords: game?.keywords,
});

export const dynamic = "force-dynamic";

type WordSearchPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    day?: string | string[];
  }>;
};

export default async function WordSearchPage({
  searchParams,
}: WordSearchPageProps) {
  if (!game) {
    return null;
  }

  const params = await searchParams;
  const mode = parsePuzzlePlayMode(params.mode);
  const dayKey = mode === "daily" ? normalizeDayKey(params.day) : null;
  const dailyLabel = dayKey ? formatDailyPuzzleDate(dayKey) : null;
  const classicHref = buildGamePlayHref("word-search");
  const dailyHref = buildGamePlayHref("word-search", {
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
                  <Search className="size-4" />
                )}
                {mode === "daily" && dailyLabel
                  ? `Daily · ${dailyLabel}`
                  : game.status}
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                {mode === "daily"
                  ? "Everyone sweeps the same hidden-word grid today."
                  : "Sweep the letter grid, trace the hidden words, and save the cleanest clears."}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {mode === "daily"
                  ? "Daily Word Search uses one shared grid for everyone on the same date. Clear the whole list fast, avoid bad lines, and compete on that exact puzzle instead of a private random board."
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
                  ? "Daily saves only compare against this date-specific grid, so every verified score is racing on the same hidden-word layout."
                  : "Hidden words can run in straight lines across the grid in any direction. Finish the full list quickly and keep bad traces low to preserve more score."}
              </p>
            </div>
          </section>
        </div>

        <WordSearchGameShell mode={mode} dayKey={dayKey ?? undefined} />
      </section>
    </main>
  );
}

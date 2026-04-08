import Link from "next/link";
import { BrainCircuit, CalendarDays, Keyboard, Trophy } from "lucide-react";
import GameCards from "@/components/games/gameCards";
import { WordleGameShell } from "@/components/games/wordle-game-shell";
import {
  buildGamePlayHref,
  formatDailyPuzzleDate,
  normalizeDayKey,
  parsePuzzlePlayMode,
} from "@/lib/games/daily";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("wordle");
const featureCards = [
  {
    id: "shared-word-bank",
    icon: BrainCircuit,
    iconClassName: "text-primary",
    title: "Shared word bank",
    description:
      "The answer pool comes from a dedicated editable word file, so future words can be added in one place without touching the game UI.",
  },
  {
    id: "keyboard-first",
    icon: Keyboard,
    iconClassName: "text-accent",
    title: "Keyboard first",
    description:
      "Physical keyboard input and a full on-screen layout keep the puzzle fast on desktop and still playable on phones.",
  },
  {
    id: "solve-for-score",
    icon: Trophy,
    iconClassName: "text-secondary",
    title: "Solve-for-score",
    description:
      "Shorter solves with fewer guesses keep more of the run intact for verified leaderboard saves.",
  },
];

export const metadata = buildMetadata({
  title: "Wordle",
  description: game?.longDescription,
  path: "/games/wordle",
  image: game?.heroImage,
  keywords: game?.keywords,
});

export const dynamic = "force-dynamic";

type WordlePageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    day?: string | string[];
  }>;
};

export default async function WordlePage({ searchParams }: WordlePageProps) {
  if (!game) {
    return null;
  }

  const params = await searchParams;
  const mode = parsePuzzlePlayMode(params.mode);
  const dayKey = mode === "daily" ? normalizeDayKey(params.day) : null;
  const dailyLabel = dayKey ? formatDailyPuzzleDate(dayKey) : null;
  const classicHref = buildGamePlayHref("wordle");
  const dailyHref = buildGamePlayHref("wordle", {
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
                  <BrainCircuit className="size-4" />
                )}
                {mode === "daily" && dailyLabel
                  ? `Daily · ${dailyLabel}`
                  : game.status}
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                {mode === "daily"
                  ? "Everyone gets the same five-letter word today."
                  : "Guess the five-letter word before the six-row board runs dry."}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {mode === "daily"
                  ? "Daily Wordle uses one shared answer for everyone on the same date. Solve it quickly, burn as few guesses as possible, and compete against the rest of the site on that exact board."
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
                  ? "Daily saves stay inside this date-specific board, so every verified score is competing on the same answer."
                  : "Only solved boards can be saved. The score falls as the timer climbs and as extra guesses get burned, so the cleanest reads are worth the most."}
              </p>
            </div>
          </section>
        </div>

        <WordleGameShell mode={mode} dayKey={dayKey ?? undefined} />
      </section>
    </main>
  );
}

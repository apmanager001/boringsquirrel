import { WordSearchGame } from "@/components/games/wordSearch/word-search-game";
import type { PuzzlePlayMode } from "@/lib/games/daily";
import {
  createDailyWordSearchPuzzle,
  createWordSearchPuzzle,
} from "@/lib/games/word-search";

type WordSearchGameShellProps = {
  mode?: PuzzlePlayMode;
  dayKey?: string;
};

export function WordSearchGameShell({
  mode = "classic",
  dayKey,
}: WordSearchGameShellProps) {
  const isDailyMode = mode === "daily" && Boolean(dayKey);

  return (
    <WordSearchGame
      initialPuzzle={
        isDailyMode && dayKey
          ? createDailyWordSearchPuzzle(dayKey)
          : createWordSearchPuzzle()
      }
      mode={isDailyMode ? "daily" : "classic"}
      dayKey={dayKey ?? null}
    />
  );
}

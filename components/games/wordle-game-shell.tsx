import { WordleGame } from "@/components/games/wordle-game";
import type { PuzzlePlayMode } from "@/lib/games/daily";
import {
  createDailyWordlePuzzle,
  createWordlePuzzle,
} from "@/lib/games/wordle";

type WordleGameShellProps = {
  mode?: PuzzlePlayMode;
  dayKey?: string;
};

export function WordleGameShell({
  mode = "classic",
  dayKey,
}: WordleGameShellProps) {
  const isDailyMode = mode === "daily" && Boolean(dayKey);

  return (
    <WordleGame
      initialPuzzle={
        isDailyMode && dayKey
          ? createDailyWordlePuzzle(dayKey)
          : createWordlePuzzle()
      }
      mode={isDailyMode ? "daily" : "classic"}
      dayKey={dayKey ?? null}
    />
  );
}

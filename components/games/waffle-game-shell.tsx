import { WaffleGame } from "@/components/games/waffle-game";
import type { PuzzlePlayMode } from "@/lib/games/daily";
import {
  createDailyWafflePuzzle,
  createWafflePuzzle,
} from "@/lib/games/waffle";

type WaffleGameShellProps = {
  mode?: PuzzlePlayMode;
  dayKey?: string;
};

export function WaffleGameShell({
  mode = "classic",
  dayKey,
}: WaffleGameShellProps) {
  const isDailyMode = mode === "daily" && Boolean(dayKey);

  return (
    <WaffleGame
      initialPuzzle={
        isDailyMode && dayKey
          ? createDailyWafflePuzzle(dayKey)
          : createWafflePuzzle()
      }
      mode={isDailyMode ? "daily" : "classic"}
      dayKey={dayKey ?? null}
    />
  );
}

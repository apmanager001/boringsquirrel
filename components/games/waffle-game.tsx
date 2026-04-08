"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RefreshCcw, Shuffle } from "lucide-react";
import { LazyScorePanel } from "@/components/games/lazy-score-panel";
import GameScores from "@/components/games/gameScores";
import {
  buildGamePlayHref,
  createDailyScoreKey,
  formatDailyPuzzleDate,
  type PuzzlePlayMode,
} from "@/lib/games/daily";
import {
  WAFFLE_MAX_SWAPS,
  calculateWaffleScore,
  cloneWaffleGrid,
  countCompletedWaffleWords,
  countCorrectWaffleTiles,
  createDailyWafflePuzzle,
  createWafflePuzzle,
  formatWaffleTime,
  getWaffleTileStatus,
  isWaffleFillablePosition,
  isWaffleSolved,
  readWaffleColumnWord,
  readWaffleRowWord,
  swapWaffleLetters,
  type WafflePosition,
  type WafflePuzzle,
} from "@/lib/games/waffle";
import { getGameBySlug } from "@/lib/site";

const scoreHook = getGameBySlug("waffle")?.scoreHook;

type WaffleGameProps = {
  initialPuzzle: WafflePuzzle;
  mode?: PuzzlePlayMode;
  dayKey?: string | null;
};

type WaffleStatus = "playing" | "won" | "lost";

function getWaffleCellClassName(
  status: "correct" | "present" | "absent" | "blank",
) {
  if (status === "correct") {
    return "border-success/35 bg-success/18 text-success";
  }

  if (status === "present") {
    return "border-accent/35 bg-accent/18 text-accent";
  }

  if (status === "blank") {
    return "border-base-300/18 bg-white/45 text-base-content/52";
  }

  return "border-base-300/20 bg-base-100/80 text-base-content";
}

export function WaffleGame({
  initialPuzzle,
  mode = "classic",
  dayKey,
}: WaffleGameProps) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [grid, setGrid] = useState(() =>
    cloneWaffleGrid(initialPuzzle.startGrid),
  );
  const [selectedCell, setSelectedCell] = useState<WafflePosition | null>(null);
  const [swapsUsed, setSwapsUsed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<WaffleStatus>("playing");
  const [feedback, setFeedback] = useState<string | null>(
    "Select one tile, then another tile to swap them.",
  );
  const [score, setScore] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDailyMode = mode === "daily" && Boolean(dayKey);
  const dailyLabel =
    isDailyMode && dayKey ? formatDailyPuzzleDate(dayKey) : null;

  useEffect(() => {
    if (status !== "playing") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status, puzzle.startGrid]);

  function resetGame() {
    startTransition(() => {
      const nextPuzzle =
        isDailyMode && dayKey
          ? createDailyWafflePuzzle(dayKey)
          : createWafflePuzzle();

      setPuzzle(nextPuzzle);
      setGrid(cloneWaffleGrid(nextPuzzle.startGrid));
      setSelectedCell(null);
      setSwapsUsed(0);
      setElapsedSeconds(0);
      setStatus("playing");
      setFeedback("Select one tile, then another tile to swap them.");
      setScore(null);
    });
  }

  function handleCellSelection(row: number, col: number) {
    if (status !== "playing" || !isWaffleFillablePosition(row, col)) {
      return;
    }

    if (!selectedCell) {
      setSelectedCell({ row, col });
      setFeedback("Pick a second tile to make the swap.");
      return;
    }

    if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null);
      setFeedback("Selection cleared. Pick any tile to start the swap.");
      return;
    }

    if (grid[selectedCell.row]?.[selectedCell.col] === grid[row]?.[col]) {
      setSelectedCell(null);
      setFeedback("Those tiles already match. Pick a different letter pair.");
      return;
    }

    const nextGrid = swapWaffleLetters(grid, selectedCell, { row, col });
    const nextSwapsUsed = swapsUsed + 1;
    const solved = isWaffleSolved(nextGrid, puzzle.solutionGrid);

    setGrid(nextGrid);
    setSelectedCell(null);
    setSwapsUsed(nextSwapsUsed);

    if (solved) {
      const nextScore = calculateWaffleScore({
        elapsedSeconds,
        swapsUsed: nextSwapsUsed,
      });

      setStatus("won");
      setScore(nextScore);
      setFeedback(
        `Board solved with ${Math.max(0, WAFFLE_MAX_SWAPS - nextSwapsUsed)} swap${
          WAFFLE_MAX_SWAPS - nextSwapsUsed === 1 ? "" : "s"
        } left.`,
      );
      return;
    }

    if (nextSwapsUsed >= puzzle.maxSwaps) {
      setStatus("lost");
      setFeedback("Swap budget spent. Start a new board to keep climbing.");
      return;
    }

    setFeedback(
      `${Math.max(0, puzzle.maxSwaps - nextSwapsUsed)} swaps left. Keep aligning the crossings.`,
    );
  }

  const rowWords = useMemo(
    () => [0, 2, 4].map((row) => readWaffleRowWord(grid, row).toUpperCase()),
    [grid],
  );
  const columnWords = useMemo(
    () => [0, 2, 4].map((col) => readWaffleColumnWord(grid, col).toUpperCase()),
    [grid],
  );
  const completedWords = useMemo(
    () =>
      countCompletedWaffleWords(
        grid,
        puzzle.horizontalWords,
        puzzle.verticalWords,
      ),
    [grid, puzzle.horizontalWords, puzzle.verticalWords],
  );
  const correctTiles = useMemo(
    () => countCorrectWaffleTiles(grid, puzzle.solutionGrid),
    [grid, puzzle.solutionGrid],
  );
  const scorePreview = useMemo(
    () => calculateWaffleScore({ elapsedSeconds, swapsUsed }),
    [elapsedSeconds, swapsUsed],
  );
  const scoreStats = useMemo(
    () => [
      {
        label: "Time",
        value: formatWaffleTime(elapsedSeconds),
      },
      {
        label: "Swaps left",
        value: Math.max(0, puzzle.maxSwaps - swapsUsed),
      },
      {
        label: "Words",
        value: `${completedWords}/6`,
      },
      {
        label: "Correct tiles",
        value: `${correctTiles}/21`,
      },
    ],
    [completedWords, correctTiles, elapsedSeconds, puzzle.maxSwaps, swapsUsed],
  );
  const statusTitle =
    status === "won"
      ? "Crossword locked"
      : status === "lost"
        ? "Budget spent"
        : isDailyMode
          ? "Daily board"
          : "Swap phase";
  const statusBody =
    status === "won"
      ? isDailyMode && dailyLabel
        ? `The shared ${dailyLabel} waffle is solved. ${scoreHook ?? ""}`
        : `Six crossing words are now in place. ${scoreHook ?? ""}`
      : status === "lost"
        ? isDailyMode && dailyLabel
          ? `This ${dailyLabel} daily board used all fifteen swaps before the full grid clicked together.`
          : "This run used all fifteen swaps before the full grid clicked together."
        : isDailyMode && dailyLabel
          ? `Everyone gets the same ${dailyLabel} crossings. Correct letters turn green immediately, while amber tiles still belong elsewhere on the board.`
          : "Correct letters turn green immediately, while amber tiles belong to at least one crossing word but still need better placement.";

  return (
    <div className="card-surface rounded-4xl p-4 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker before:w-6">
                {isDailyMode ? "Daily puzzle" : "Ready to Play"}
              </p>
              <h2 className="display-font text-3xl font-semibold">
                Untangle the crossings
              </h2>
            </div>

            <button
              type="button"
              onClick={resetGame}
              className="btn btn-secondary rounded-full"
            >
              <RefreshCcw className="size-4" />
              {isPending
                ? isDailyMode
                  ? "Resetting..."
                  : "Mixing..."
                : isDailyMode
                  ? "Restart daily"
                  : "New board"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-[1.75rem] border border-base-300/15 bg-base-100/55 p-4">
              <div className="mx-auto grid max-w-lg grid-cols-5 gap-2 sm:gap-3">
                {Array.from({ length: 5 }, (_, row) =>
                  Array.from({ length: 5 }, (_, col) => {
                    if (!isWaffleFillablePosition(row, col)) {
                      return (
                        <div
                          key={`${row}-${col}`}
                          className="aspect-square rounded-[1.1rem] border border-dashed border-base-300/10 bg-white/12"
                        />
                      );
                    }

                    const tileStatus = getWaffleTileStatus({
                      grid,
                      solutionGrid: puzzle.solutionGrid,
                      horizontalWords: puzzle.horizontalWords,
                      verticalWords: puzzle.verticalWords,
                      row,
                      col,
                    });
                    const selected =
                      selectedCell?.row === row && selectedCell?.col === col;

                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        onClick={() => handleCellSelection(row, col)}
                        className={`flex aspect-square items-center justify-center rounded-[1.1rem] border text-2xl font-semibold uppercase transition sm:text-3xl ${getWaffleCellClassName(
                          tileStatus,
                        )} ${selected ? "ring-2 ring-primary/45 ring-inset" : ""}`}
                      >
                        {grid[row]?.[col]}
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.2rem] bg-base-100/72 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-base-content/42">
                    Rows
                  </p>
                  <div className="mt-3 space-y-2 font-semibold uppercase tracking-[0.18em] text-base-content/78">
                    {rowWords.map((word, index) => (
                      <p key={`row-${index}`}>{word}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.2rem] bg-base-100/72 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-base-content/42">
                    Columns
                  </p>
                  <div className="mt-3 space-y-2 font-semibold uppercase tracking-[0.18em] text-base-content/78">
                    {columnWords.map((word, index) => (
                      <p key={`col-${index}`}>{word}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker before:w-4">Run status</p>
                  <h3 className="display-font text-2xl font-semibold">
                    {statusTitle}
                  </h3>
                </div>
                <Shuffle className="size-6 text-primary" />
              </div>

              <p className="mt-4 text-sm leading-7 text-base-content/78">
                {statusBody}
              </p>

              {feedback ? (
                <div className="mt-4 rounded-[1.2rem] border border-base-300/15 bg-base-100/75 px-4 py-3 text-sm leading-7 text-base-content/75">
                  {feedback}
                </div>
              ) : null}

              <div className="mt-4 rounded-[1.2rem] bg-base-100/72 p-4 text-sm leading-7 text-base-content/72">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/42">
                  Scoring note
                </p>
                <p className="mt-2">
                  {scoreHook ??
                    "Every swap left on the board becomes bonus room for the leaderboard."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full space-y-4 xl:max-w-sm">
          <GameScores score={score ?? scorePreview} stats={scoreStats} />
          <LazyScorePanel
            gameSlug="waffle"
            score={score ?? 0}
            scoreKey={
              isDailyMode && dayKey ? createDailyScoreKey(dayKey) : undefined
            }
            callbackPath={
              isDailyMode && dayKey
                ? buildGamePlayHref("waffle", {
                    mode: "daily",
                    dayKey,
                  })
                : undefined
            }
            scopeLabel={
              isDailyMode && dailyLabel
                ? `the ${dailyLabel} Waffle board`
                : undefined
            }
            details={{
              swapsRemaining: Math.max(0, WAFFLE_MAX_SWAPS - swapsUsed),
              elapsedSeconds,
              completedWords,
            }}
            canSubmit={status === "won"}
          />
        </aside>
      </div>
    </div>
  );
}

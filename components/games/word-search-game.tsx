"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { LazyScorePanel } from "@/components/games/lazy-score-panel";
import GameScores from "@/components/games/gameScores";
import {
  buildGamePlayHref,
  createDailyScoreKey,
  formatDailyPuzzleDate,
  type PuzzlePlayMode,
} from "@/lib/games/daily";
import {
  buildWordSearchPath,
  calculateWordSearchScore,
  createDailyWordSearchPuzzle,
  createWordSearchPuzzle,
  doesWordSearchPathMatchPlacement,
  formatWordSearchTime,
  type WordSearchPosition,
  type WordSearchPuzzle,
} from "@/lib/games/word-search";
import { getGameBySlug } from "@/lib/site";

const scoreHook = getGameBySlug("word-search")?.scoreHook;

type WordSearchGameProps = {
  initialPuzzle: WordSearchPuzzle;
  mode?: PuzzlePlayMode;
  dayKey?: string | null;
};

function toCellKey(position: WordSearchPosition) {
  return `${position.row}:${position.col}`;
}

export function WordSearchGame({
  initialPuzzle,
  mode = "classic",
  dayKey,
}: WordSearchGameProps) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [anchorCell, setAnchorCell] = useState<WordSearchPosition | null>(null);
  const [selectionPath, setSelectionPath] = useState<WordSearchPosition[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wrongSelections, setWrongSelections] = useState(0);
  const [status, setStatus] = useState<"playing" | "won">("playing");
  const [feedback, setFeedback] = useState<string | null>(
    "Drag across a straight line to lock a word from the list.",
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
  }, [status, puzzle.words]);

  function resetGame() {
    startTransition(() => {
      const nextPuzzle =
        isDailyMode && dayKey
          ? createDailyWordSearchPuzzle(dayKey)
          : createWordSearchPuzzle();

      setPuzzle(nextPuzzle);
      setFoundWords([]);
      setAnchorCell(null);
      setSelectionPath([]);
      setElapsedSeconds(0);
      setWrongSelections(0);
      setStatus("playing");
      setFeedback("Drag across a straight line to lock a word from the list.");
      setScore(null);
    });
  }

  function clearSelection() {
    setAnchorCell(null);
    setSelectionPath([]);
  }

  const foundWordSet = useMemo(() => new Set(foundWords), [foundWords]);

  function finishSelection(path: WordSearchPosition[]) {
    if (status !== "playing") {
      clearSelection();
      return;
    }

    if (path.length < 2) {
      clearSelection();
      return;
    }

    const matchedPlacement = puzzle.placements.find(
      (placement) =>
        !foundWordSet.has(placement.word) &&
        doesWordSearchPathMatchPlacement(path, placement),
    );

    if (!matchedPlacement) {
      setWrongSelections((current) => current + 1);
      setFeedback("That line does not match an unfinished word.");
      clearSelection();
      return;
    }

    const nextFoundCount = foundWords.length + 1;

    setFoundWords((current) => [...current, matchedPlacement.word]);
    clearSelection();

    if (nextFoundCount >= puzzle.words.length) {
      const nextScore = calculateWordSearchScore({
        elapsedSeconds,
        wrongSelections,
        wordCount: puzzle.words.length,
      });

      setStatus("won");
      setScore(nextScore);
      setFeedback(
        `Grid cleared. ${matchedPlacement.word.toUpperCase()} finished the run.`,
      );
      return;
    }

    setFeedback(`${matchedPlacement.word.toUpperCase()} found.`);
  }

  useEffect(() => {
    function handlePointerUp() {
      if (anchorCell) {
        clearSelection();
      }
    }

    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [anchorCell]);

  const foundPlacements = useMemo(
    () =>
      puzzle.placements.filter((placement) => foundWordSet.has(placement.word)),
    [foundWordSet, puzzle.placements],
  );
  const foundCellKeys = useMemo(() => {
    const keys = new Set<string>();

    foundPlacements.forEach((placement) => {
      placement.cells.forEach((cell) => {
        keys.add(toCellKey(cell));
      });
    });

    return keys;
  }, [foundPlacements]);
  const selectionKeys = useMemo(
    () => new Set(selectionPath.map((cell) => toCellKey(cell))),
    [selectionPath],
  );
  const activeSelectionWord = useMemo(
    () =>
      selectionPath
        .map((cell) => puzzle.grid[cell.row]?.[cell.col] ?? "")
        .join("")
        .toUpperCase(),
    [puzzle.grid, selectionPath],
  );
  const scorePreview = useMemo(
    () =>
      calculateWordSearchScore({
        elapsedSeconds,
        wrongSelections,
        wordCount: puzzle.words.length,
      }),
    [elapsedSeconds, puzzle.words.length, wrongSelections],
  );
  const scoreStats = useMemo(
    () => [
      {
        label: "Time",
        value: formatWordSearchTime(elapsedSeconds),
      },
      {
        label: "Found",
        value: `${foundWords.length}/${puzzle.words.length}`,
      },
      {
        label: "Misses",
        value: wrongSelections,
      },
      {
        label: "Grid",
        value: `${puzzle.size}x${puzzle.size}`,
      },
    ],
    [
      elapsedSeconds,
      foundWords.length,
      puzzle.size,
      puzzle.words.length,
      wrongSelections,
    ],
  );
  const statusTitle = status === "won" ? "Grid cleared" : "Search live";
  const statusBody =
    status === "won"
      ? isDailyMode && dailyLabel
        ? `Every word from the shared ${dailyLabel} grid is locked in. ${scoreHook ?? ""}`
        : `Every listed word is locked in. ${scoreHook ?? ""}`
      : isDailyMode && dailyLabel
        ? `Everyone gets the same ${dailyLabel} grid. Trace horizontal, vertical, or diagonal lines and keep the miss count low.`
        : "Trace horizontal, vertical, or diagonal lines. Reverse direction still counts as long as the line matches a listed word.";

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
                Scan the grid
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
                  : "Rebuilding..."
                : isDailyMode
                  ? "Restart daily"
                  : "New grid"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-[1.75rem] border border-base-300/15 bg-base-100/55 p-4">
              <div
                className="mx-auto grid max-w-2xl gap-1.5 sm:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
                }}
              >
                {puzzle.grid.map((row, rowIndex) =>
                  row.map((letter, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const cellKey = `${rowIndex}:${colIndex}`;
                    const found = foundCellKeys.has(cellKey);
                    const selected = selectionKeys.has(cellKey);

                    return (
                      <button
                        key={key}
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();

                          if (status !== "playing") {
                            return;
                          }

                          const nextCell = { row: rowIndex, col: colIndex };

                          setAnchorCell(nextCell);
                          setSelectionPath([nextCell]);
                        }}
                        onPointerEnter={(event) => {
                          event.preventDefault();

                          if (!anchorCell || status !== "playing") {
                            return;
                          }

                          setSelectionPath(
                            buildWordSearchPath(anchorCell, {
                              row: rowIndex,
                              col: colIndex,
                            }),
                          );
                        }}
                        onPointerUp={(event) => {
                          event.preventDefault();

                          if (!anchorCell || status !== "playing") {
                            return;
                          }

                          finishSelection(
                            buildWordSearchPath(anchorCell, {
                              row: rowIndex,
                              col: colIndex,
                            }),
                          );
                        }}
                        className={`touch-none select-none rounded-xl border text-sm font-semibold uppercase transition sm:text-base ${
                          found
                            ? "border-success/35 bg-success/18 text-success"
                            : selected
                              ? "border-primary/35 bg-primary/18 text-primary"
                              : "border-base-300/18 bg-white/70 text-base-content"
                        } aspect-square`}
                      >
                        {letter}
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="mt-5 rounded-[1.2rem] bg-base-100/72 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-base-content/42">
                    Target words
                  </p>
                  {activeSelectionWord ? (
                    <span className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                      {activeSelectionWord}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {puzzle.words.map((word) => {
                    const found = foundWordSet.has(word);

                    return (
                      <span
                        key={word}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          found
                            ? "border-success/35 bg-success/18 text-success"
                            : "border-base-300/18 bg-white/70 text-base-content/72"
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
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
                <Search className="size-6 text-primary" />
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
                    "Faster clears with fewer false lines keep more of the score intact for the leaderboard."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full space-y-4 xl:max-w-sm">
          <GameScores score={score ?? scorePreview} stats={scoreStats} />
          <LazyScorePanel
            gameSlug="word-search"
            score={score ?? 0}
            scoreKey={
              isDailyMode && dayKey ? createDailyScoreKey(dayKey) : undefined
            }
            callbackPath={
              isDailyMode && dayKey
                ? buildGamePlayHref("word-search", {
                    mode: "daily",
                    dayKey,
                  })
                : undefined
            }
            scopeLabel={
              isDailyMode && dailyLabel
                ? `the ${dailyLabel} Word Search board`
                : undefined
            }
            details={{
              elapsedSeconds,
              wordCount: puzzle.words.length,
              wrongSelections,
            }}
            canSubmit={status === "won"}
          />
        </aside>
      </div>
    </div>
  );
}

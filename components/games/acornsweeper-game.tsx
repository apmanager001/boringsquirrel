"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Eye,
  Info,
  Nut,
  RefreshCcw,
  Squirrel,
  Trophy,
  TriangleAlert,
} from "lucide-react";
import { ScorePanel } from "@/components/games/score-panel";
import { AcornSweeperAboveBoard } from "@/components/games/acornsweeper-above-board";
import {
  armAcornSweeperBoard,
  calculateAcornSweeperScore,
  countAcornSweeperFlags,
  countAcornSweeperRevealedSafeCells,
  createAcornSweeperBoard,
  finishWinningAcornSweeperBoard,
  formatAcornSweeperTime,
  getAcornSweeperDifficultyConfig,
  isAcornSweeperSolved,
  revealAcornSweeperArea,
  revealAllAcorns,
  toggleAcornSweeperFlag,
  type AcornSweeperBoard,
  type AcornSweeperDifficulty,
} from "@/lib/games/acornsweeper";

type AcornSweeperGameState = {
  id: number;
  difficulty: AcornSweeperDifficulty;
  board: AcornSweeperBoard;
  armed: boolean;
  flagMode: boolean;
  status: "ready" | "playing" | "won" | "lost";
  score: number | null;
};

function createAcornSweeperGameState(
  difficulty: AcornSweeperDifficulty,
): AcornSweeperGameState {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    difficulty,
    board: createAcornSweeperBoard(difficulty),
    armed: false,
    flagMode: false,
    status: "ready",
    score: null,
  };
}

function getNumberToneClass(value: number) {
  switch (value) {
    case 1:
      return "text-primary";
    case 2:
      return "text-success";
    case 3:
      return "text-secondary";
    case 4:
      return "text-accent";
    case 5:
      return "text-error";
    case 6:
      return "text-info";
    case 7:
      return "text-base-content";
    default:
      return "text-base-content/70";
  }
}

function buildCellAriaLabel(
  row: number,
  col: number,
  cell: AcornSweeperBoard[number][number],
) {
  if (cell.flagged && !cell.revealed) {
    return `Row ${row + 1}, column ${col + 1}, flagged with a squirrel`;
  }

  if (!cell.revealed) {
    return `Row ${row + 1}, column ${col + 1}, hidden`;
  }

  if (cell.hasAcorn) {
    return `Row ${row + 1}, column ${col + 1}, acorn`;
  }

  if (cell.adjacentAcorns === 0) {
    return `Row ${row + 1}, column ${col + 1}, clear`;
  }

  return `Row ${row + 1}, column ${col + 1}, ${cell.adjacentAcorns} adjacent acorns`;
}

export function AcornSweeperGame() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [game, setGame] = useState<AcornSweeperGameState>(() =>
    createAcornSweeperGameState("medium"),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (game.status !== "playing") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [game.id, game.status]);

  const difficultyDetails = getAcornSweeperDifficultyConfig(game.difficulty);
  const flagCount = useMemo(
    () => countAcornSweeperFlags(game.board),
    [game.board],
  );
  const safeRevealedCount = useMemo(
    () => countAcornSweeperRevealedSafeCells(game.board),
    [game.board],
  );
  const totalSafeCells =
    difficultyDetails.rows * difficultyDetails.cols -
    difficultyDetails.acornCount;
  const progressPercent = Math.round(
    (safeRevealedCount / totalSafeCells) * 100,
  );
  const scorePreview = useMemo(
    () =>
      game.status === "lost"
        ? 0
        : calculateAcornSweeperScore({
            difficulty: game.difficulty,
            elapsedSeconds,
          }),
    [elapsedSeconds, game.difficulty, game.status],
  );
  const denseBoard = difficultyDetails.cols >= 14;
  const iconSizeClass = denseBoard ? "size-4 sm:size-5" : "size-5 sm:size-6";
  const digitSizeClass = denseBoard
    ? "text-sm sm:text-base"
    : "text-base sm:text-lg";

  function resetGame(nextDifficulty = game.difficulty) {
    startTransition(() => {
      setElapsedSeconds(0);
      setGame(createAcornSweeperGameState(nextDifficulty));
    });
  }

  function toggleFlagMode() {
    setGame((current) => ({
      ...current,
      flagMode: !current.flagMode,
    }));
  }

  function toggleFlag(row: number, col: number) {
    setGame((current) => {
      if (current.status === "won" || current.status === "lost") {
        return current;
      }

      const nextBoard = toggleAcornSweeperFlag(current.board, row, col);

      if (nextBoard === current.board) {
        return current;
      }

      return {
        ...current,
        board: nextBoard,
      };
    });
  }

  function revealCell(row: number, col: number) {
    setGame((current) => {
      if (current.status === "won" || current.status === "lost") {
        return current;
      }

      let nextBoard = current.board;
      let armed = current.armed;

      if (!armed) {
        nextBoard = armAcornSweeperBoard(
          current.board,
          current.difficulty,
          row,
          col,
        );
        armed = true;
      }

      const targetCell = nextBoard[row]?.[col];

      if (!targetCell || targetCell.flagged || targetCell.revealed) {
        return current;
      }

      const revealResult = revealAcornSweeperArea(nextBoard, row, col);

      if (revealResult.detonated) {
        return {
          ...current,
          armed,
          board: revealAllAcorns(revealResult.board, row, col),
          status: "lost",
          score: 0,
        };
      }

      const solved = isAcornSweeperSolved(revealResult.board);

      return {
        ...current,
        armed,
        board: solved
          ? finishWinningAcornSweeperBoard(revealResult.board)
          : revealResult.board,
        status: solved ? "won" : "playing",
        score: solved
          ? calculateAcornSweeperScore({
              difficulty: current.difficulty,
              elapsedSeconds,
            })
          : current.score,
      };
    });
  }

  function handlePrimaryAction(row: number, col: number) {
    if (game.flagMode) {
      toggleFlag(row, col);
      return;
    }

    revealCell(row, col);
  }

  const statusTitle =
    game.status === "won"
      ? "Field cleared"
      : game.status === "lost"
        ? "Hidden acorn hit"
        : game.flagMode
          ? "Flag mode active"
          : game.armed
            ? "Sweep in progress"
            : "Fresh field";
  const statusBody =
    game.status === "won"
      ? `Clean finish. ${difficultyDetails.label} cleared in ${formatAcornSweeperTime(elapsedSeconds)} with ${flagCount} squirrel flag${flagCount === 1 ? "" : "s"} on the board.`
      : game.status === "lost"
        ? "One of the hidden acorns was uncovered, so this run is over. Start a new field or drop the difficulty and go again."
        : game.flagMode
          ? "Primary taps place squirrel flags while flag mode is on. Right-click still works any time."
          : "Reveal open space, read the numbers, and use squirrel flags to mark suspected acorns before you dig any deeper.";

  return (
    <div className="card-surface rounded-4xl p-4 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker before:w-6">Ready to Play</p>
              <h2 className="display-font text-3xl font-semibold">
                Clear the glade
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {(["easy", "medium", "hard"] as AcornSweeperDifficulty[]).map(
                (difficulty) => {
                  const active = difficulty === game.difficulty;

                  return (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => resetGame(difficulty)}
                      className={`btn rounded-full ${
                        active
                          ? "btn-primary"
                          : "border border-base-300/20 bg-white/35 text-base-content hover:bg-white/55"
                      }`}
                    >
                      {getAcornSweeperDifficultyConfig(difficulty).label}
                    </button>
                  );
                },
              )}
              <button
                type="button"
                onClick={() => resetGame()}
                className="btn btn-secondary rounded-full"
              >
                <RefreshCcw className="size-4" />
                {isPending ? "Scattering..." : "New field"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <AcornSweeperAboveBoard
              game={game}
              difficultyDetails={difficultyDetails}
              statusTitle={statusTitle}
              statusBody={statusBody}
              flagCount={flagCount}
              onToggleFlagMode={toggleFlagMode}
            />

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="rounded-[1.75rem] border border-base-300/15 bg-base-100/55 p-3 sm:p-4">
                <div className="mx-auto w-full max-w-176 overflow-hidden rounded-[1.2rem] border border-base-300/20 bg-white/55">
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${difficultyDetails.cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {game.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          type="button"
                          onClick={() =>
                            handlePrimaryAction(rowIndex, colIndex)
                          }
                          onContextMenu={(event) => {
                            event.preventDefault();
                            toggleFlag(rowIndex, colIndex);
                          }}
                          className={`relative aspect-square min-w-0 border-r border-b border-base-300/16 transition ${
                            cell.revealed
                              ? cell.exploded
                                ? "bg-error/20 ring-2 ring-error/35 ring-inset"
                                : "bg-white/28"
                              : cell.flagged
                                ? "bg-accent/10 hover:bg-accent/16"
                                : "bg-base-100/78 hover:bg-base-100"
                          } ${
                            rowIndex === 0
                              ? "border-t border-t-base-300/20"
                              : ""
                          } ${
                            colIndex === 0
                              ? "border-l border-l-base-300/20"
                              : ""
                          }`}
                          aria-label={buildCellAriaLabel(
                            rowIndex,
                            colIndex,
                            cell,
                          )}
                        >
                          {cell.revealed ? (
                            cell.hasAcorn ? (
                              <span className="flex h-full items-center justify-center">
                                <Nut
                                  className={`${iconSizeClass} ${
                                    cell.exploded
                                      ? "text-error"
                                      : "text-base-content/78"
                                  }`}
                                />
                              </span>
                            ) : cell.adjacentAcorns > 0 ? (
                              <span
                                className={`flex h-full items-center justify-center font-semibold ${digitSizeClass} ${getNumberToneClass(cell.adjacentAcorns)}`}
                              >
                                {cell.adjacentAcorns}
                              </span>
                            ) : (
                              <span className="flex h-full items-center justify-center">
                                <span className="size-1.5 rounded-full bg-base-content/12" />
                              </span>
                            )
                          ) : cell.flagged ? (
                            <span className="flex h-full items-center justify-center">
                              <Squirrel
                                className={`${iconSizeClass} text-accent`}
                              />
                            </span>
                          ) : null}
                        </button>
                      )),
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-base-300/15 bg-white/38 p-4">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGame((current) => ({
                        ...current,
                        flagMode: false,
                      }))
                    }
                    className={`btn h-12 rounded-2xl ${
                      !game.flagMode
                        ? "btn-primary"
                        : "border border-base-300/20 bg-base-100/75 hover:bg-base-100"
                    }`}
                  >
                    <Eye className="size-4" />
                    Reveal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGame((current) => ({
                        ...current,
                        flagMode: true,
                      }))
                    }
                    className={`btn h-12 rounded-2xl ${
                      game.flagMode
                        ? "btn-primary"
                        : "border border-base-300/20 bg-base-100/75 hover:bg-base-100"
                    }`}
                  >
                    <Squirrel className="size-4" />
                    Flag
                  </button>

                  <div
                    className="tooltip tooltip-top md:tooltip-left mt-2 flex items-center justify-center"
                    data-tip="Right-click any hidden square to place or remove a squirrel. On touch screens, switch to Flag mode before tapping."
                  >
                    <Info className="text-info" />
                  </div>
                </div>

                <div className="mt-4 rounded-[1.2rem] bg-base-100/75 p-4 text-sm leading-7 text-base-content/74">
                  <div className="">
                    <Nut className="size-4 text-secondary" />
                    Hidden acorns end the run.
                  </div>
                  <div className="mt-2">
                    <Squirrel className="size-4 text-accent" />
                    Squirrels mark danger without opening the square.
                  </div>
                  <div className="mt-2">
                    <TriangleAlert className="size-4 text-primary" />
                    Clear every safe square to bank the score.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full space-y-4 xl:max-w-sm">
          <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-base-content/45">
                  Score
                </p>
                <p className="display-font mt-2 text-5xl font-semibold text-base-content">
                  {game.score ?? scorePreview}
                </p>
              </div>
              <Trophy className="size-7 text-primary" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Time
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatAcornSweeperTime(elapsedSeconds)}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Squirrels
                </p>
                <p className="mt-2 text-2xl font-semibold">{flagCount}</p>
              </div>
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Acorns
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {difficultyDetails.acornCount}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Progress
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {progressPercent}%
                </p>
              </div>
            </div>
          </div>

          <ScorePanel
            gameSlug="acornsweeper"
            score={game.score ?? 0}
            details={{
              difficulty: game.difficulty,
              elapsedSeconds,
              flagCount,
              acornCount: difficultyDetails.acornCount,
              clearedCount: safeRevealedCount,
            }}
            canSubmit={game.status === "won"}
          />
        </aside>
      </div>
    </div>
  );
}

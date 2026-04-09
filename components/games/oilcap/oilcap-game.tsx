"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  RotateCcw,
  Route,
  ShieldAlert,
  Trash2,
  Trophy,
} from "lucide-react";
import { ScorePanel } from "@/components/games/score-panel";

type Direction = "up" | "right" | "down" | "left";
type PieceId =
  | "horizontalStraight"
  | "verticalStraight"
  | "leftToDown"
  | "leftToUp"
  | "rightToDown"
  | "rightToUp"
  | "cross";

type Board = Array<Array<PieceId | null>>;

type Snapshot = {
  board: Board;
  queue: PieceId[];
  selectedQueueIndex: number;
  placementsRemaining: number;
};

type RunState = Snapshot & {
  targetRow: number;
  history: Snapshot[];
};

const ROWS = 5;
const COLS = 6;
const START_ROW = 2;
const MAX_PLACEMENTS = 12;
const TARGET_ROW_OPTIONS = [0, 1, 3, 4] as const;

const directionOffsets: Record<Direction, [number, number]> = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1],
};

const oppositeDirection: Record<Direction, Direction> = {
  up: "down",
  right: "left",
  down: "up",
  left: "right",
};

const pieceDetails: Record<
  PieceId,
  {
    label: string;
    src: string;
    connectors: Direction[];
    note: string;
  }
> = {
  horizontalStraight: {
    label: "Straight",
    src: "/pipe/horizontalStraight.svg",
    connectors: ["left", "right"],
    note: "Keeps a run flat and efficient.",
  },
  verticalStraight: {
    label: "Vertical",
    src: "/pipe/verticalStraight.svg",
    connectors: ["up", "down"],
    note: "Climbs or drops between rows.",
  },
  leftToDown: {
    label: "Left to Down",
    src: "/pipe/leftToDown.svg",
    connectors: ["left", "down"],
    note: "Turns a route downward.",
  },
  leftToUp: {
    label: "Left to Up",
    src: "/pipe/leftToUp.svg",
    connectors: ["left", "up"],
    note: "Lifts a route upward.",
  },
  rightToDown: {
    label: "Right to Down",
    src: "/pipe/rightToDown.svg",
    connectors: ["right", "down"],
    note: "Drops toward the cap from the right.",
  },
  rightToUp: {
    label: "Right to Up",
    src: "/pipe/rightToUp.svg",
    connectors: ["right", "up"],
    note: "Climbs toward the cap from the right.",
  },
  cross: {
    label: "Cross",
    src: "/pipe/cross.svg",
    connectors: ["up", "right", "down", "left"],
    note: "Expensive, but great when multiple branches connect.",
  },
};

const piecePool = Object.keys(pieceDetails) as PieceId[];

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  );
}

function copyBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function drawPiece(excludedPieces: PieceId[] = []) {
  const availablePieces = piecePool.filter(
    (piece) => !excludedPieces.includes(piece),
  );
  const sourcePool = availablePieces.length > 0 ? availablePieces : piecePool;

  return sourcePool[Math.floor(Math.random() * sourcePool.length)]!;
}

function createQueue(length: number) {
  const queue: PieceId[] = [];

  while (queue.length < length) {
    queue.push(drawPiece(queue));
  }

  return queue;
}

function pickTargetRow() {
  return TARGET_ROW_OPTIONS[
    Math.floor(Math.random() * TARGET_ROW_OPTIONS.length)
  ]!;
}

function createRun(): RunState {
  return {
    board: createEmptyBoard(),
    queue: createQueue(3),
    selectedQueueIndex: 0,
    placementsRemaining: MAX_PLACEMENTS,
    targetRow: pickTargetRow(),
    history: [],
  };
}

function keyForCell(row: number, col: number) {
  return `${row}:${col}`;
}

function isInsideBoard(row: number, col: number) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function analyzeBoard(
  board: Board,
  targetRow: number,
  placementsRemaining: number,
) {
  const placedCells = board.flatMap((row, rowIndex) =>
    row.flatMap((piece, colIndex) =>
      piece ? [{ piece, row: rowIndex, col: colIndex }] : [],
    ),
  );
  const startPiece = board[START_ROW][0];
  const reachable = new Set<string>();
  const queue: Array<[number, number]> = [];
  let matchedEdgeAccumulator = 0;
  let goalConnected = false;

  if (startPiece && pieceDetails[startPiece].connectors.includes("left")) {
    reachable.add(keyForCell(START_ROW, 0));
    queue.push([START_ROW, 0]);
  }

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    const piece = board[row][col];

    if (!piece) {
      continue;
    }

    for (const direction of pieceDetails[piece].connectors) {
      if (row === targetRow && col === COLS - 1 && direction === "right") {
        goalConnected = true;
      }

      const [rowOffset, colOffset] = directionOffsets[direction];
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (!isInsideBoard(nextRow, nextCol)) {
        continue;
      }

      const nextPiece = board[nextRow][nextCol];

      if (!nextPiece) {
        continue;
      }

      if (
        !pieceDetails[nextPiece].connectors.includes(
          oppositeDirection[direction],
        )
      ) {
        continue;
      }

      matchedEdgeAccumulator += 1;

      const nextKey = keyForCell(nextRow, nextCol);

      if (!reachable.has(nextKey)) {
        reachable.add(nextKey);
        queue.push([nextRow, nextCol]);
      }
    }
  }

  let leakCount = 0;

  for (const cellKey of reachable) {
    const [rowText, colText] = cellKey.split(":");
    const row = Number(rowText);
    const col = Number(colText);
    const piece = board[row][col];

    if (!piece) {
      continue;
    }

    for (const direction of pieceDetails[piece].connectors) {
      if (row === START_ROW && col === 0 && direction === "left") {
        continue;
      }

      if (row === targetRow && col === COLS - 1 && direction === "right") {
        continue;
      }

      const [rowOffset, colOffset] = directionOffsets[direction];
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (!isInsideBoard(nextRow, nextCol)) {
        leakCount += 1;
        continue;
      }

      const nextPiece = board[nextRow][nextCol];

      if (
        !nextPiece ||
        !pieceDetails[nextPiece].connectors.includes(
          oppositeDirection[direction],
        )
      ) {
        leakCount += 1;
      }
    }
  }

  const usefulCount = reachable.size;
  const placedCount = placedCells.length;
  const isolatedCount = Math.max(0, placedCount - usefulCount);
  const matchedConnections = Math.floor(matchedEdgeAccumulator / 2);
  const score = Math.max(
    0,
    usefulCount * 18 +
      matchedConnections * 10 +
      (goalConnected ? 80 + placementsRemaining * 6 : 0) -
      isolatedCount * 14 -
      leakCount * 5,
  );

  return {
    goalConnected,
    placedCount,
    usefulCount,
    isolatedCount,
    leakCount,
    matchedConnections,
    score,
  };
}

export function OilcapGame() {
  const [run, setRun] = useState<RunState>(() => createRun());

  const analysis = useMemo(
    () => analyzeBoard(run.board, run.targetRow, run.placementsRemaining),
    [run.board, run.placementsRemaining, run.targetRow],
  );
  const roundComplete = analysis.goalConnected || run.placementsRemaining === 0;
  const selectedPiece = run.queue[run.selectedQueueIndex];

  function resetRun() {
    setRun(createRun());
  }

  function undoMove() {
    setRun((current) => {
      const previous = current.history.at(-1);

      if (!previous) {
        return current;
      }

      return {
        ...current,
        ...previous,
        history: current.history.slice(0, -1),
      };
    });
  }

  function placePiece(row: number, col: number) {
    setRun((current) => {
      if (current.placementsRemaining === 0) {
        return current;
      }

      if (current.board[row][col]) {
        return current;
      }

      const nextPiece = current.queue[current.selectedQueueIndex];

      if (!nextPiece) {
        return current;
      }

      const snapshot: Snapshot = {
        board: copyBoard(current.board),
        queue: [...current.queue],
        selectedQueueIndex: current.selectedQueueIndex,
        placementsRemaining: current.placementsRemaining,
      };
      const nextBoard = copyBoard(current.board);
      nextBoard[row][col] = nextPiece;
      const nextQueue = current.queue.filter(
        (_, index) => index !== current.selectedQueueIndex,
      );
      nextQueue.push(drawPiece(nextQueue));

      return {
        ...current,
        board: nextBoard,
        queue: nextQueue,
        placementsRemaining: current.placementsRemaining - 1,
        selectedQueueIndex: Math.min(
          current.selectedQueueIndex,
          nextQueue.length - 1,
        ),
        history: [...current.history, snapshot],
      };
    });
  }

  const statusTitle = analysis.goalConnected
    ? "Cap sealed"
    : run.placementsRemaining === 0
      ? "Spill detected"
      : "Route the pressure";
  const statusBody = analysis.goalConnected
    ? `Clean run. ${analysis.usefulCount} useful pipes are feeding the cap, and ${run.placementsRemaining} placements were left in reserve.`
    : run.placementsRemaining === 0
      ? `The board ran out of placements before the route reached row ${run.targetRow + 1} on the right wall.`
      : `Connect the source on row ${START_ROW + 1} to the cap on row ${run.targetRow + 1}. Reachable pipes score well; isolated or leaking pipes drag the total down.`;

  return (
    <div className="card-surface rounded-4xl p-4 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-kicker before:w-6">Playable prototype</p>
              <h2 className="display-font text-3xl font-semibold">
                Build the line before the spill
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={undoMove}
                disabled={run.history.length === 0}
                className="btn btn-ghost rounded-full border border-base-300/20 bg-white/35"
              >
                <Trash2 className="size-4" />
                Undo
              </button>
              <button
                type="button"
                onClick={resetRun}
                className="btn btn-primary rounded-full"
              >
                <RotateCcw className="size-4" />
                New delivery
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto pb-2">
            <div className="min-w-176 space-y-2">
              {Array.from({ length: ROWS }, (_, row) => (
                <div
                  key={row}
                  className="grid grid-cols-[3.8rem_repeat(6,minmax(0,1fr))_3.8rem] gap-2"
                >
                  <div
                    className={`flex h-16 items-center justify-center rounded-2xl border ${
                      row === START_ROW
                        ? "border-primary/40 bg-primary/12"
                        : "border-base-300/15 bg-white/20"
                    }`}
                  >
                    {row === START_ROW ? (
                      <Image
                        src="/pipe/start.svg"
                        alt="Oil source"
                        width={52}
                        height={52}
                        className="-rotate-90"
                      />
                    ) : (
                      <Droplets className="size-4 text-base-content/25" />
                    )}
                  </div>

                  {Array.from({ length: COLS }, (_, col) => {
                    const piece = run.board[row][col];
                    const isEntryCell = row === START_ROW && col === 0;
                    const isExitCell =
                      row === run.targetRow && col === COLS - 1;

                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        onClick={() => placePiece(row, col)}
                        disabled={roundComplete || Boolean(piece)}
                        className={`relative flex h-16 items-center justify-center rounded-2xl border transition ${
                          piece
                            ? "border-base-300/15 bg-base-100/75"
                            : "border-dashed border-base-300/25 bg-white/25 hover:border-primary/35 hover:bg-white/40"
                        } ${
                          isEntryCell || isExitCell
                            ? "ring-1 ring-primary/30 ring-offset-0"
                            : ""
                        } ${roundComplete ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {piece ? (
                          <Image
                            src={pieceDetails[piece].src}
                            alt={pieceDetails[piece].label}
                            width={58}
                            height={58}
                          />
                        ) : isEntryCell ? (
                          <span className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-primary/70">
                            In
                          </span>
                        ) : isExitCell ? (
                          <span className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-primary/70">
                            Cap
                          </span>
                        ) : null}
                      </button>
                    );
                  })}

                  <div
                    className={`flex h-16 items-center justify-center rounded-2xl border ${
                      row === run.targetRow
                        ? "border-secondary/40 bg-secondary/12"
                        : "border-base-300/15 bg-white/20"
                    }`}
                  >
                    {row === run.targetRow ? (
                      <Image
                        src="/pipe/start.svg"
                        alt="Oil cap"
                        width={52}
                        height={52}
                        className="rotate-90"
                      />
                    ) : (
                      <ArrowRight className="size-4 text-base-content/25" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-full space-y-4 xl:max-w-sm">
          <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-base-content/45">
                  Current score
                </p>
                <p className="display-font mt-2 text-5xl font-semibold text-base-content">
                  {analysis.score}
                </p>
              </div>
              <Trophy className="size-7 text-primary" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Useful
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {analysis.usefulCount}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Waste
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {analysis.isolatedCount}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Leaks
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {analysis.leakCount}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-base-100/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
                  Moves left
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {run.placementsRemaining}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker before:w-4">Queue</p>
                <h3 className="display-font text-2xl font-semibold">
                  Choose the next pipe
                </h3>
              </div>
              <Route className="size-6 text-accent" />
            </div>

            <div className="mt-4 space-y-3">
              {run.queue.map((piece, index) => {
                const selected = index === run.selectedQueueIndex;

                return (
                  <button
                    key={`${piece}-${index}`}
                    type="button"
                    onClick={() =>
                      setRun((current) => ({
                        ...current,
                        selectedQueueIndex: index,
                      }))
                    }
                    className={`flex w-full items-center gap-4 rounded-[1.4rem] border px-4 py-3 text-left transition ${
                      selected
                        ? "border-primary/35 bg-primary/10"
                        : "border-base-300/15 bg-base-100/75 hover:border-base-300/25"
                    }`}
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/80">
                      <Image
                        src={pieceDetails[piece].src}
                        alt={pieceDetails[piece].label}
                        width={44}
                        height={44}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-base-content">
                        {pieceDetails[piece].label}
                      </p>
                      <p className="text-sm leading-6 text-base-content/72">
                        {pieceDetails[piece].note}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPiece ? (
              <p className="mt-4 text-sm leading-7 text-base-content/72">
                Selected piece:{" "}
                <span className="font-semibold text-base-content">
                  {pieceDetails[selectedPiece].label}
                </span>
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
            <div className="flex items-center gap-3">
              {analysis.goalConnected ? (
                <CheckCircle2 className="size-6 text-success" />
              ) : roundComplete ? (
                <ShieldAlert className="size-6 text-error" />
              ) : (
                <Droplets className="size-6 text-primary" />
              )}
              <div>
                <p className="section-kicker before:hidden">Run status</p>
                <h3 className="display-font text-2xl font-semibold">
                  {statusTitle}
                </h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-base-content/78">
              {statusBody}
            </p>
            <div className="mt-4 rounded-[1.2rem] bg-base-100/70 p-4 text-sm leading-7 text-base-content/75">
              Score math: useful pipes and matched connections increase the
              total. Isolated tiles and leaks subtract from it. Finishing with
              moves left adds a delivery bonus.
            </div>
          </div>

          <ScorePanel
            gameSlug="oilcap"
            score={analysis.score}
            details={{
              goalConnected: analysis.goalConnected,
              usefulCount: analysis.usefulCount,
              isolatedCount: analysis.isolatedCount,
              leakCount: analysis.leakCount,
              matchedConnections: analysis.matchedConnections,
              placementsRemaining: run.placementsRemaining,
            }}
            canSubmit={roundComplete && analysis.score > 0}
          />
        </aside>
      </div>
    </div>
  );
}

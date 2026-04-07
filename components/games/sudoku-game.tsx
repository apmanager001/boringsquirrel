"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  Eraser,
  Info,
  Menu,
  NotebookPen,
  RefreshCcw,
  Trophy,
  Ruler,
} from "lucide-react";
import {
  calculateSudokuScore,
  cloneSudokuGrid,
  createSudokuPuzzle,
  formatSudokuTime,
  getSudokuCandidates,
  getSudokuDifficultyConfig,
  getSudokuFilledCount,
  getSudokuPeerPositions,
  isSudokuSolved,
  type SudokuDifficulty,
  type SudokuPuzzle,
} from "@/lib/games/sudoku";
import { useGameInfoDrawer } from "@/components/games/game-info-drawer";
import { LazyScorePanel } from "@/components/games/lazy-score-panel";
import SudokuAboveBoard from "./sudoku-aboveBoard";
import { getGameBySlug } from "@/lib/site";

const scoreHook = getGameBySlug("sudoku")?.scoreHook;

type SelectedCell = {
  row: number;
  col: number;
};

type SudokuNotes = number[][][];

type SudokuGameState = {
  id: number;
  difficulty: SudokuDifficulty;
  puzzle: number[][];
  solution: number[][];
  board: number[][];
  givens: boolean[][];
  notes: SudokuNotes;
  clueCount: number;
  selectedCell: SelectedCell | null;
  noteMode: boolean;
  mistakes: number;
  status: "playing" | "solved";
  score: number | null;
  errorCell: SelectedCell | null;
};

type SudokuScoreSummaryProps = {
  score: number;
  elapsedSeconds: number;
  mistakes: number;
  clueCount: number;
  progressPercent: number;
  compact?: boolean;
};

type SudokuGameProps = {
  initialPuzzle?: SudokuPuzzle;
};

function createEmptyNotes() {
  return Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [] as number[]),
  );
}

function getInitialSelectedCell(board: number[][]) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row]?.[col] === 0) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
}

function createSudokuGameStateFromPuzzle(
  puzzle: SudokuPuzzle,
  gameId = 1,
): SudokuGameState {
  return {
    id: gameId,
    difficulty: puzzle.difficulty,
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    board: cloneSudokuGrid(puzzle.puzzle),
    givens: puzzle.givens,
    notes: createEmptyNotes(),
    clueCount: puzzle.clueCount,
    selectedCell: getInitialSelectedCell(puzzle.puzzle),
    noteMode: false,
    mistakes: 0,
    status: "playing",
    score: null,
    errorCell: null,
  };
}

function createSudokuGameState(difficulty: SudokuDifficulty): SudokuGameState {
  const puzzle = createSudokuPuzzle(difficulty);

  return createSudokuGameStateFromPuzzle(
    puzzle,
    Date.now() + Math.floor(Math.random() * 1000),
  );
}

function cloneNotes(notes: SudokuNotes) {
  return notes.map((row) => row.map((cell) => [...cell]));
}

function removeNoteFromPeers(
  notes: SudokuNotes,
  row: number,
  col: number,
  value: number,
) {
  const nextNotes = cloneNotes(notes);

  for (const peer of getSudokuPeerPositions(row, col)) {
    nextNotes[peer.row][peer.col] = nextNotes[peer.row][peer.col].filter(
      (note) => note !== value,
    );
  }

  return nextNotes;
}

function getDigitCounts(board: number[][]) {
  const counts = new Map<number, number>();

  for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    counts.set(digit, 0);
  }

  for (const row of board) {
    for (const value of row) {
      if (value !== 0) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
  }

  return counts;
}

function SudokuScoreSummary({
  score,
  elapsedSeconds,
  mistakes,
  clueCount,
  progressPercent,
  compact = false,
}: SudokuScoreSummaryProps) {
  const cardClassName = compact
    ? "rounded-[1.35rem] border border-primary/15 bg-white/50 p-4"
    : "rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5";
  const iconClassName = compact ? "size-6 text-primary" : "size-7 text-primary";
  const scoreClassName = compact
    ? "display-font mt-2 text-4xl font-semibold text-base-content"
    : "display-font mt-2 text-5xl font-semibold text-base-content";
  const gridClassName = compact
    ? "mt-4 grid grid-cols-2 gap-2"
    : "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2";
  const statCardClassName = compact
    ? "rounded-[1rem] bg-base-100/80 p-3"
    : "rounded-[1.2rem] bg-base-100/70 p-4";
  const statLabelClassName = compact
    ? "text-[0.65rem] uppercase tracking-[0.26em] text-base-content/45"
    : "text-xs uppercase tracking-[0.3em] text-base-content/45";
  const statValueClassName = compact
    ? "mt-1 text-xl font-semibold"
    : "mt-2 text-2xl font-semibold";

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-base-content/45">
            Score
          </p>
          <p className={scoreClassName}>{score}</p>
        </div>
        <Trophy className={iconClassName} />
      </div>

      <div className={gridClassName}>
        <div className={statCardClassName}>
          <p className={statLabelClassName}>Time</p>
          <p className={statValueClassName}>
            {formatSudokuTime(elapsedSeconds)}
          </p>
        </div>
        <div className={statCardClassName}>
          <p className={statLabelClassName}>Mistakes</p>
          <p className={statValueClassName}>{mistakes}</p>
        </div>
        <div className={statCardClassName}>
          <p className={statLabelClassName}>Clues</p>
          <p className={statValueClassName}>{clueCount}</p>
        </div>
        <div className={statCardClassName}>
          <p className={statLabelClassName}>Progress</p>
          <p className={statValueClassName}>{progressPercent}%</p>
        </div>
      </div>
    </div>
  );
}

export function SudokuGame({ initialPuzzle }: SudokuGameProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [game, setGame] = useState<SudokuGameState>(() =>
    initialPuzzle
      ? createSudokuGameStateFromPuzzle(initialPuzzle)
      : createSudokuGameState("medium"),
  );
  const [showHint, setShowHint] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { openDrawer } = useGameInfoDrawer();

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

  useEffect(() => {
    if (!game.errorCell) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGame((current) =>
        current.errorCell
          ? {
              ...current,
              errorCell: null,
            }
          : current,
      );
    }, 420);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [game.errorCell]);

  const difficultyDetails = getSudokuDifficultyConfig(game.difficulty);
  const selectedValue = game.selectedCell
    ? (game.board[game.selectedCell.row]?.[game.selectedCell.col] ?? 0)
    : 0;
  const filledCount = useMemo(
    () => getSudokuFilledCount(game.board),
    [game.board],
  );
  const progressPercent = Math.round((filledCount / 81) * 100);
  const digitCounts = useMemo(() => getDigitCounts(game.board), [game.board]);
  const scorePreview = useMemo(
    () =>
      calculateSudokuScore({
        difficulty: game.difficulty,
        elapsedSeconds,
        mistakes: game.mistakes,
      }),
    [elapsedSeconds, game.difficulty, game.mistakes],
  );
  const selectedCandidates = useMemo(() => {
    if (!game.selectedCell) {
      return [];
    }

    return getSudokuCandidates(
      game.board,
      game.selectedCell.row,
      game.selectedCell.col,
    );
  }, [game.board, game.selectedCell]);

  function resetGame(nextDifficulty = game.difficulty) {
    startTransition(() => {
      setElapsedSeconds(0);
      setGame(createSudokuGameState(nextDifficulty));
    });
  }

  const moveSelection = useCallback((rowDelta: number, colDelta: number) => {
    setGame((current) => {
      const nextSelected = current.selectedCell ?? { row: 0, col: 0 };

      return {
        ...current,
        selectedCell: {
          row: (nextSelected.row + rowDelta + 9) % 9,
          col: (nextSelected.col + colDelta + 9) % 9,
        },
      };
    });
  }, []);

  function selectCell(row: number, col: number) {
    setGame((current) => ({
      ...current,
      selectedCell: { row, col },
    }));
  }

  const clearSelectedCell = useCallback(() => {
    setGame((current) => {
      if (!current.selectedCell || current.status !== "playing") {
        return current;
      }

      const { row, col } = current.selectedCell;

      if (current.givens[row]?.[col]) {
        return current;
      }

      const nextBoard = cloneSudokuGrid(current.board);
      const nextNotes = cloneNotes(current.notes);

      nextBoard[row][col] = 0;
      nextNotes[row][col] = [];

      return {
        ...current,
        board: nextBoard,
        notes: nextNotes,
      };
    });
  }, []);

  const applyInput = useCallback(
    (value: number) => {
      setGame((current) => {
        if (!current.selectedCell || current.status !== "playing") {
          return current;
        }

        const { row, col } = current.selectedCell;

        if (current.givens[row]?.[col]) {
          return current;
        }

        const nextBoard = cloneSudokuGrid(current.board);
        const nextNotes = cloneNotes(current.notes);
        const currentValue = nextBoard[row][col];

        if (current.noteMode && currentValue === 0) {
          const nextCellNotes = nextNotes[row][col].includes(value)
            ? nextNotes[row][col].filter((note) => note !== value)
            : [...nextNotes[row][col], value].sort(
                (left, right) => left - right,
              );

          nextNotes[row][col] = nextCellNotes;

          return {
            ...current,
            notes: nextNotes,
          };
        }

        if (current.solution[row]?.[col] !== value) {
          return {
            ...current,
            mistakes: current.mistakes + 1,
            errorCell: { row, col },
          };
        }

        nextBoard[row][col] = value;
        nextNotes[row][col] = [];
        const cleanedNotes = removeNoteFromPeers(nextNotes, row, col, value);
        const solved = isSudokuSolved(nextBoard, current.solution);

        return {
          ...current,
          board: nextBoard,
          notes: cleanedNotes,
          status: solved ? "solved" : current.status,
          score: solved
            ? calculateSudokuScore({
                difficulty: current.difficulty,
                elapsedSeconds,
                mistakes: current.mistakes,
              })
            : current.score,
        };
      });
    },
    [elapsedSeconds],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      ) {
        return;
      }

      if (!game.selectedCell) {
        return;
      }

      const lowerKey = event.key.toLowerCase();

      if (lowerKey === "n") {
        event.preventDefault();
        setGame((current) => ({
          ...current,
          noteMode: !current.noteMode,
        }));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-1, 0);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelection(0, 1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(1, 0);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelection(0, -1);
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        applyInput(Number(event.key));
        return;
      }

      if (["Backspace", "Delete", "0"].includes(event.key)) {
        event.preventDefault();
        clearSelectedCell();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [applyInput, clearSelectedCell, game.selectedCell, moveSelection]);

  const statusTitle =
    game.status === "solved"
      ? "Board solved"
      : game.noteMode
        ? "Pencil mode active"
        : "Live board";
  const statusBody =
    game.status === "solved"
      ? `Clean finish. ${difficultyDetails.label} locked in at ${formatSudokuTime(elapsedSeconds)} with ${game.mistakes} mistake${game.mistakes === 1 ? "" : "s"}.`
      : game.noteMode
        ? "Number inputs toggle pencil marks instead of placing a final value."
        : "Use the keyboard or the on-screen pad. Wrong answers are rejected and count as mistakes.";

  return (
    <div className="card-surface rounded-4xl p-4 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-center sm:justify-between">
            <div className="flex items-start justify-between gap-4 sm:block">
              <div>
                <p className="section-kicker before:w-6">Ready to Play</p>
                <h2 className="display-font text-3xl font-semibold">
                  Solve the board
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="tooltip tooltip-left text-primary" data-tip={scoreHook}>
                  <Ruler className="size-4" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openDrawer({
                      title: "Sudoku info",
                      content: (
                        <div className="space-y-4">
                          <SudokuScoreSummary
                            score={game.score ?? scorePreview}
                            elapsedSeconds={elapsedSeconds}
                            mistakes={game.mistakes}
                            clueCount={game.clueCount}
                            progressPercent={progressPercent}
                            compact
                          />
                          <SudokuAboveBoard
                            game={game}
                            showHint={showHint}
                            selectedCandidates={selectedCandidates}
                            difficultyDetails={difficultyDetails}
                            statusTitle={statusTitle}
                            statusBody={statusBody}
                            onToggleHint={() =>
                              setShowHint((current) => !current)
                            }
                            compact
                          />
                        </div>
                      ),
                    })
                  }
                  className="btn btn-ghost btn-circle sm:hidden"
                  aria-label="Open Sudoku information"
                >
                  <Menu className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {(["easy", "medium", "hard"] as SudokuDifficulty[]).map(
                (difficulty) => {
                  const active = difficulty === game.difficulty;

                  return (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => resetGame(difficulty)}
                      className={`btn btn-sm md:btn-md rounded-full ${
                        active
                          ? "btn-primary"
                          : "border border-base-300/20 bg-white/35 text-base-content hover:bg-white/55"
                      }`}
                    >
                      {getSudokuDifficultyConfig(difficulty).label}
                    </button>
                  );
                },
              )}
              <button
                type="button"
                onClick={() => resetGame()}
                className="btn btn-sm md:btn-md btn-secondary rounded-full"
              >
                <RefreshCcw className="size-4" />
                {isPending ? "Generating..." : "New board"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-4">
              {/* <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]"> */}
              <div className="hidden sm:block">
                <SudokuAboveBoard
                  game={game}
                  showHint={showHint}
                  selectedCandidates={selectedCandidates}
                  difficultyDetails={difficultyDetails}
                  statusTitle={statusTitle}
                  statusBody={statusBody}
                  onToggleHint={() => setShowHint((current) => !current)}
                />
              </div>
              {/* <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between rounded-3xl border border-base-300/15 bg-white/38 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3 bg-white/38">
                  <label
                    htmlFor="hint"
                    className="text-xs font-semibold"
                  >
                    Show Hint for selected cell
                  </label>
                  <input
                    id="hint"
                    onClick={() => setShowHint((current) => !current)}
                    type="checkbox"
                    defaultChecked={showHint}
                    className="toggle toggle-primary"
                  />
                </div>

                <p className="flex items-center text-sm sm:text-base leading-6 text-base-content/70 sm:max-w-md min-h-12">
                  {showHint && selectedCandidates.length > 0
                    ? `${selectedCandidates.join(", ")}`
                    : "Select an editable square to see live candidates."}
                </p>
              </div> */}
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
                <div className="rounded-[1.75rem] sm:border border-base-300/15 bg-base-100/55 sm:p-4">
                  <div className="mx-auto w-full max-w-176 overflow-hidden border border-base-300/20 bg-white/55">
                    <div className="grid grid-cols-9">
                      {Array.from({ length: 9 }, (_, row) =>
                        Array.from({ length: 9 }, (_, col) => {
                          const cellValue = game.board[row]?.[col] ?? 0;
                          const cellNotes = game.notes[row]?.[col] ?? [];
                          const selected =
                            game.selectedCell?.row === row &&
                            game.selectedCell?.col === col;
                          const related =
                            game.selectedCell &&
                            (game.selectedCell.row === row ||
                              game.selectedCell.col === col ||
                              (Math.floor(game.selectedCell.row / 3) ===
                                Math.floor(row / 3) &&
                                Math.floor(game.selectedCell.col / 3) ===
                                  Math.floor(col / 3)));
                          const matchingValue =
                            selectedValue !== 0 && cellValue === selectedValue;
                          const errorCell =
                            game.errorCell?.row === row &&
                            game.errorCell?.col === col;
                          const borderClasses = [
                            row === 0
                              ? "border-t-2 border-t-base-300/55"
                              : "border-t border-t-base-300/16",
                            col === 0
                              ? "border-l-2 border-l-base-300/55"
                              : "border-l border-l-base-300/16",
                            (row + 1) % 3 === 0
                              ? "border-b-2 border-b-base-300/55"
                              : "border-b border-b-base-300/16",
                            (col + 1) % 3 === 0
                              ? "border-r-2 border-r-base-300/55"
                              : "border-r border-r-base-300/16",
                          ].join(" ");

                          return (
                            <button
                              key={`${row}-${col}`}
                              type="button"
                              onClick={() => selectCell(row, col)}
                              className={`relative aspect-square min-w-0 p-1 transition sm:p-2 ${borderClasses} ${
                                selected
                                  ? "bg-primary/18"
                                  : errorCell
                                    ? "bg-error/18"
                                    : matchingValue
                                      ? "bg-secondary/16"
                                      : related
                                        ? "bg-white/65"
                                        : "bg-white/40"
                              } ${errorCell ? "ring-2 ring-error/45 ring-inset" : ""}`}
                              aria-label={`Row ${row + 1}, column ${col + 1}`}
                            >
                              {cellValue !== 0 ? (
                                <span
                                  className={`flex h-full items-center justify-center text-xl font-semibold sm:text-2xl ${
                                    game.givens[row]?.[col]
                                      ? "text-base-content"
                                      : "text-primary"
                                  }`}
                                >
                                  {cellValue}
                                </span>
                              ) : (
                                <span className="grid h-full grid-cols-3 grid-rows-3 text-[0.52rem] font-medium text-base-content/52 sm:text-[0.62rem]">
                                  {Array.from({ length: 9 }, (_, noteIndex) => {
                                    const noteValue = noteIndex + 1;

                                    return (
                                      <span
                                        key={noteValue}
                                        className="flex items-center justify-center"
                                      >
                                        {cellNotes.includes(noteValue)
                                          ? noteValue
                                          : ""}
                                      </span>
                                    );
                                  })}
                                </span>
                              )}
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-base-300/15 bg-white/38 p-4">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => {
                      const complete = (digitCounts.get(value) ?? 0) === 9;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => applyInput(value)}
                          className={`btn h-12 rounded-2xl text-lg ${
                            complete
                              ? "border border-success/30 bg-success/14 text-success"
                              : "border border-base-300/20 bg-base-100/75 text-base-content hover:bg-base-100"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                    <div
                      className="btn h-12 rounded-2xl border border-base-300/20 bg-base-100/75 hover:bg-base-100 tooltip tooltip-top md:tooltip-left"
                      data-tip={`N toggles pencil mode. Arrow keys move the cursor.
                    Backspace or Delete clears the selected cell.`}
                    >
                      <Info className="text-info" />
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedCell}
                      className="btn h-12 rounded-2xl border border-base-300/20 bg-base-100/75 hover:bg-base-100"
                    >
                      <Eraser className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGame((current) => ({
                          ...current,
                          noteMode: !current.noteMode,
                        }))
                      }
                      className={`btn h-12 rounded-2xl ${
                        game.noteMode
                          ? "btn-primary"
                          : "border border-base-300/20 bg-base-100/75 hover:bg-base-100"
                      }`}
                    >
                      <NotebookPen className="size-4" />
                    </button>
                  </div>
                  {/* <p className="mt-3 text-sm leading-7 text-base-content/74">
                    `N` toggles pencil mode. Arrow keys move the cursor.
                    `Backspace` or `Delete` clears the selected cell.
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full space-y-4 xl:max-w-sm">
          <div className="hidden sm:block">
            <SudokuScoreSummary
              score={game.score ?? scorePreview}
              elapsedSeconds={elapsedSeconds}
              mistakes={game.mistakes}
              clueCount={game.clueCount}
              progressPercent={progressPercent}
            />
          </div>
          {/* <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker before:w-4">Difficulty</p>
                <h3 className="display-font text-2xl font-semibold">
                  {difficultyDetails.label}
                </h3>
              </div>
              <Sparkles className="size-6 text-accent" />
            </div>
            <p className="mt-4 text-sm leading-7 text-base-content/78">
              {difficultyDetails.description}
            </p>
            <div className="mt-4 rounded-[1.2rem] bg-base-100/70 p-4 text-sm leading-7 text-base-content/75">
              Base score is {difficultyDetails.baseScore}. Faster finishes
              preserve more of the speed bonus, and each mistake costs{" "}
              {difficultyDetails.mistakePenalty} points.
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
            <div className="flex items-center gap-3">
              {game.status === "solved" ? (
                <CheckCircle2 className="size-6 text-success" />
              ) : game.errorCell ? (
                <TriangleAlert className="size-6 text-error" />
              ) : game.noteMode ? (
                <NotebookPen className="size-6 text-primary" />
              ) : (
                <Keyboard className="size-6 text-primary" />
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
            {game.status === "solved" ? (
              <button
                type="button"
                onClick={() => resetGame()}
                className="btn btn-primary mt-4 rounded-full"
              >
                <TimerReset className="size-4" />
                Play another board
              </button>
            ) : null}
          </div> */}
          <LazyScorePanel
            gameSlug="sudoku"
            score={game.score ?? 0}
            details={{
              difficulty: game.difficulty,
              elapsedSeconds,
              mistakes: game.mistakes,
              clueCount: game.clueCount,
            }}
            canSubmit={game.status === "solved"}
          />
        </aside>
      </div>
    </div>
  );
}

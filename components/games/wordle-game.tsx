"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Delete, Keyboard, Menu, RefreshCcw, Ruler } from "lucide-react";
import { LazyScorePanel } from "@/components/games/lazy-score-panel";
import GameScores from "@/components/games/gameScores";
import {
  buildGamePlayHref,
  createDailyScoreKey,
  formatDailyPuzzleDate,
  type PuzzlePlayMode,
} from "@/lib/games/daily";
import {
  WORDLE_MAX_GUESSES,
  buildWordleKeyboardState,
  calculateWordleScore,
  createDailyWordlePuzzle,
  createWordlePuzzle,
  evaluateWordleGuess,
  formatWordleTime,
  isValidWordleGuess,
  type WordleEvaluatedGuess,
  type WordlePuzzle,
} from "@/lib/games/wordle";
import { getGameBySlug } from "@/lib/site";
import { useGameInfoDrawer } from "@/components/games/game-info-drawer";
import toast from "react-hot-toast";
import next from "next";

const scoreHook = getGameBySlug("wordle")?.scoreHook;
const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

type WordleGameProps = {
  initialPuzzle: WordlePuzzle;
  mode?: PuzzlePlayMode;
  dayKey?: string | null;
};

type WordleStatus = "playing" | "won" | "lost";

function getWordleKeyClassName(state?: "correct" | "present" | "absent") {
  if (state === "correct") {
    return "border-success/35 bg-success/18 text-success";
  }

  if (state === "present") {
    return "border-accent/35 bg-accent/18 text-accent";
  }

  if (state === "absent") {
    return "border-base-300/18 bg-base-300/25 text-base-content/68";
  }

  return "border-base-300/20 bg-base-100/80 text-base-content hover:bg-base-100";
}

function getWordleCellClassName(state?: "correct" | "present" | "absent") {
  if (state === "correct") {
    return "border-success/30 bg-success/16 text-success";
  }

  if (state === "present") {
    return "border-accent/30 bg-accent/16 text-accent";
  }

  if (state === "absent") {
    return "border-base-300/18 bg-base-300/16 text-base-content/65";
  }

  return "border-base-300/20 bg-base-100/70 text-base-content";
}

export function WordleGame({
  initialPuzzle,
  mode = "classic",
  dayKey,
}: WordleGameProps) {
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [guesses, setGuesses] = useState<WordleEvaluatedGuess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState<WordleStatus>("playing");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { isOpen, openDrawer } = useGameInfoDrawer();
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
  }, [status, puzzle.solution]);

  function resetGame() {
    startTransition(() => {
      setPuzzle(
        isDailyMode && dayKey
          ? createDailyWordlePuzzle(dayKey)
          : createWordlePuzzle(),
      );
      setGuesses([]);
      setCurrentGuess("");
      setStatus("playing");
      setElapsedSeconds(0);
      setFeedback(null);
      setScore(null);
    });
  }

  const handleLetter = useCallback(
    (letter: string) => {
      if (status !== "playing") {
        return;
      }

      setCurrentGuess((current) => {
        if (current.length >= puzzle.wordLength) {
          return current;
        }

        return `${current}${letter.toLowerCase()}`;
      });
      setFeedback(null);
    },
    [puzzle.wordLength, status],
  );

  const handleBackspace = useCallback(() => {
    if (status !== "playing") {
      return;
    }

    setCurrentGuess((current) => current.slice(0, -1));
  }, [status]);

  const handleSubmitGuess = useCallback(() => {
    if (status !== "playing") {
      return;
    }

    const guess = currentGuess.trim().toLowerCase();

    if (guess.length < puzzle.wordLength) {
      toast.error(`Need ${puzzle.wordLength} letters before you submit.`);
      // setFeedback(`Need ${puzzle.wordLength} letters before you submit.`);
      return;
    }

    if (!isValidWordleGuess(guess)) {
      toast.error("This is not a valid word");
      // setFeedback("That word is not in the current word bank.");
      return;
    }

    const evaluatedGuess = {
      word: guess,
      states: evaluateWordleGuess(puzzle.solution, guess),
    };
    const nextGuesses = [...guesses, evaluatedGuess];

    setGuesses(nextGuesses);
    setCurrentGuess("");

    if (guess === puzzle.solution) {
      const nextScore = calculateWordleScore({
        elapsedSeconds,
        guessCount: nextGuesses.length,
      });

      setStatus("won");
      setScore(nextScore);
      toast.success(
        `Congratulations! You solved the puzzle in ${nextGuesses.length} guess${nextGuesses.length === 1 ? "" : "es"}.`,
      );
      // setFeedback(
      //   `Solved in ${nextGuesses.length} guess${nextGuesses.length === 1 ? "" : "es"}.`,
      // );
      return;
    }

    if (nextGuesses.length >= puzzle.maxGuesses) {
      setStatus("lost");
      toast.error(`Game over. The word was ${puzzle.solution.toUpperCase()}.`);
      // setFeedback(
      //   `Out of rows. The word was ${puzzle.solution.toUpperCase()}.`,
      // );
      return;
    }

    setFeedback(null);
  }, [currentGuess, elapsedSeconds, guesses, puzzle, status]);

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

      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitGuess();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (/^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        handleLetter(event.key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBackspace, handleLetter, handleSubmitGuess]);

  const keyboardState = useMemo(
    () => buildWordleKeyboardState(guesses),
    [guesses],
  );
  const projectedGuessCount = Math.min(
    puzzle.maxGuesses,
    Math.max(1, guesses.length + 1),
  );
  const scorePreview = useMemo(
    () =>
      calculateWordleScore({
        elapsedSeconds,
        guessCount: projectedGuessCount,
      }),
    [elapsedSeconds, projectedGuessCount],
  );
  const scoreStats = useMemo(
    () => [
      {
        label: "Time",
        value: formatWordleTime(elapsedSeconds),
      },
      {
        label: "Guesses",
        value: `${guesses.length}/${puzzle.maxGuesses}`,
      },
      {
        label: "Left",
        value: Math.max(0, puzzle.maxGuesses - guesses.length),
      },
      {
        label: "Length",
        value: `${puzzle.wordLength} letters`,
      },
    ],
    [elapsedSeconds, guesses.length, puzzle.maxGuesses, puzzle.wordLength],
  );
  const statusTitle =
    status === "won"
      ? "Puzzle solved"
      : status === "lost"
        ? "Rows exhausted"
        : isDailyMode
          ? "Daily board"
          : "Fresh board";
  const statusBody =
    status === "won"
      ? isDailyMode && dailyLabel
        ? `The shared ${dailyLabel} word is cracked in ${formatWordleTime(
            elapsedSeconds,
          )}. ${scoreHook ?? ""}`
        : `Clean solve locked at ${formatWordleTime(elapsedSeconds)}. ${scoreHook ?? ""}`
      : status === "lost"
        ? isDailyMode && dailyLabel
          ? `The ${dailyLabel} daily word was ${puzzle.solution.toUpperCase()}. Reset to replay the same shared board.`
          : `The hidden word was ${puzzle.solution.toUpperCase()}. Reset to spin a fresh answer from the shared bank.`
        : isDailyMode && dailyLabel
          ? `Everyone plays the same ${dailyLabel} word. Use your keyboard or the on-screen keys and chase the cleanest daily solve.`
          : "Use your keyboard or the on-screen keys. Every valid guess reveals what belongs, what travels, and what is dead weight.";

  const drawerContent = useMemo(
    () => (
      <>
        <div className="space-y-4">
          <GameScores
            score={score ?? scorePreview}
            stats={scoreStats}
            compact
          />
        </div>
        <LazyScorePanel
          gameSlug="wordle"
          score={score ?? 0}
          scoreKey={
            isDailyMode && dayKey ? createDailyScoreKey(dayKey) : undefined
          }
          callbackPath={
            isDailyMode && dayKey
              ? buildGamePlayHref("wordle", {
                  mode: "daily",
                  dayKey,
                })
              : undefined
          }
          scopeLabel={
            isDailyMode && dailyLabel
              ? `the ${dailyLabel} Wordle board`
              : undefined
          }
          details={{
            guessCount: guesses.length,
            elapsedSeconds,
            maxGuesses: puzzle.maxGuesses,
          }}
          canSubmit={status === "won"}
        />
      </>
    ),
    [score, scorePreview, scoreStats, statusTitle, statusBody],
  );

  const openInfoDrawer = useCallback(() => {
    openDrawer({
      title: "Wordle info",
      content: drawerContent,
    });
  }, [drawerContent, openDrawer]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    openInfoDrawer();
  }, [isOpen, openInfoDrawer]);

  return (
    <div className="card-surface rounded-4xl p-4 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4 sm:block">
              <div>
                <p className="section-kicker before:w-6">
                  {isDailyMode ? "Daily puzzle" : "Ready to Play"}
                </p>
                <h2 className="display-font text-3xl font-semibold">
                  Guess the word
                </h2>
              </div>
              <div className="flex items-center gap-3 sm:hidden">
                <div
                  className="tooltip tooltip-top tooltip-end text-primary"
                  data-tip={scoreHook}
                >
                  <Ruler className="size-4" />
                </div>
                <button
                  type="button"
                  onClick={openInfoDrawer}
                  className="btn btn-ghost btn-circle"
                  aria-label="Open Wordle information"
                >
                  <Menu className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={handleSubmitGuess}
                className="btn btn-primary rounded-full"
                disabled={status !== "playing"}
              >
                <Keyboard className="size-4" />
                Enter guess
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="btn btn-secondary rounded-full"
              >
                <RefreshCcw className="size-4" />
                {isPending
                  ? isDailyMode
                    ? "Resetting..."
                    : "Shuffling..."
                  : isDailyMode
                    ? "Restart daily"
                    : "New word"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-[1.75rem] border border-base-300/15 bg-base-100/55 p-4">
              <div className="mx-auto grid max-w-xl gap-2">
                {Array.from({ length: WORDLE_MAX_GUESSES }, (_, rowIndex) => {
                  const guess = guesses[rowIndex];
                  const isActiveRow =
                    status === "playing" && rowIndex === guesses.length;
                  const rowLetters = guess
                    ? guess.word.split("")
                    : isActiveRow
                      ? Array.from(
                          { length: puzzle.wordLength },
                          (_, index) => currentGuess[index] ?? "",
                        )
                      : Array.from({ length: puzzle.wordLength }, () => "");

                  return (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-5 gap-2 sm:gap-3"
                    >
                      {rowLetters.map((letter, letterIndex) => (
                        <div
                          key={`${rowIndex}-${letterIndex}`}
                          className={`flex aspect-square items-center justify-center rounded-[1.1rem] border text-xl font-semibold uppercase tracking-[0.12em] sm:text-2xl ${
                            guess
                              ? getWordleCellClassName(
                                  guess.states[letterIndex],
                                )
                              : isActiveRow
                                ? "border-primary/24 bg-primary/10 text-base-content"
                                : "border-dashed border-base-300/18 bg-white/35 text-base-content/30"
                          }`}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {keyboardRows.map((row) => (
                  <div
                    key={row}
                    className="flex justify-center gap-1.5 sm:gap-2"
                  >
                    {row.split("").map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleLetter(letter)}
                        disabled={status !== "playing"}
                        className={`btn h-11 min-w-0 flex-1 rounded-2xl px-0 uppercase ${getWordleKeyClassName(
                          keyboardState.get(letter),
                        )}`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                ))}

                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitGuess}
                    disabled={status !== "playing"}
                    className="btn btn-primary h-11 rounded-2xl px-5"
                  >
                    <Keyboard className="size-4" />
                    Enter
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    disabled={status !== "playing"}
                    className="btn h-11 rounded-2xl border border-base-300/20 bg-base-100/75 px-5 hover:bg-base-100"
                  >
                    <Delete className="size-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden sm:block rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker before:w-4">Run status</p>
                  <h3 className="display-font text-2xl font-semibold">
                    {statusTitle}
                  </h3>
                </div>
                <Keyboard className="size-6 text-primary" />
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
                    "Fast solves with fewer rows burned keep more of the score intact for the leaderboard."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full space-y-4 xl:max-w-sm">
          <div className="hidden sm:block">
            <GameScores score={score ?? scorePreview} stats={scoreStats} />
          </div>
          <div className="hidden sm:block">
            <LazyScorePanel
              gameSlug="wordle"
              score={score ?? 0}
              scoreKey={
                isDailyMode && dayKey ? createDailyScoreKey(dayKey) : undefined
              }
              callbackPath={
                isDailyMode && dayKey
                  ? buildGamePlayHref("wordle", {
                      mode: "daily",
                      dayKey,
                    })
                  : undefined
              }
              scopeLabel={
                isDailyMode && dailyLabel
                  ? `the ${dailyLabel} Wordle board`
                  : undefined
              }
              details={{
                guessCount: guesses.length,
                elapsedSeconds,
                maxGuesses: puzzle.maxGuesses,
              }}
              canSubmit={status === "won"}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

import {
  WORDLE_ANSWER_BANK,
  isWordInBank,
  pickRandomWord,
} from "@/lib/games/word-bank";
import { createSeededRandom } from "@/lib/games/daily";

export const WORDLE_WORD_LENGTH = 5;
export const WORDLE_MAX_GUESSES = 6;

export type WordleLetterState = "correct" | "present" | "absent";

export type WordleEvaluatedGuess = {
  word: string;
  states: WordleLetterState[];
};

export type WordlePuzzle = {
  solution: string;
  wordLength: number;
  maxGuesses: number;
};

const WORDLE_BASE_SCORE = 2600;
const WORDLE_PAR_SECONDS = 240;
const WORDLE_TIME_SLICE = 560;
const WORDLE_GUESS_PENALTY = 220;

export function createWordlePuzzle({
  randomSource = Math.random,
}: {
  randomSource?: () => number;
} = {}): WordlePuzzle {
  return {
    solution: pickRandomWord(WORDLE_ANSWER_BANK, randomSource),
    wordLength: WORDLE_WORD_LENGTH,
    maxGuesses: WORDLE_MAX_GUESSES,
  };
}

export function createDailyWordlePuzzle(dayKey: string) {
  return createWordlePuzzle({
    randomSource: createSeededRandom(`wordle:${dayKey}`),
  });
}

export function formatWordleTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function isValidWordleGuess(word: string) {
  return word.length === WORDLE_WORD_LENGTH && isWordInBank(word);
}

export function evaluateWordleGuess(
  solution: string,
  guess: string,
): WordleLetterState[] {
  const normalizedSolution = solution.trim().toLowerCase();
  const normalizedGuess = guess.trim().toLowerCase();
  const states = Array.from(
    { length: WORDLE_WORD_LENGTH },
    () => "absent",
  ) as WordleLetterState[];
  const remainingCounts = new Map<string, number>();

  for (let index = 0; index < WORDLE_WORD_LENGTH; index += 1) {
    const solutionLetter = normalizedSolution[index];
    const guessLetter = normalizedGuess[index];

    if (!solutionLetter || !guessLetter) {
      continue;
    }

    if (solutionLetter === guessLetter) {
      states[index] = "correct";
      continue;
    }

    remainingCounts.set(
      solutionLetter,
      (remainingCounts.get(solutionLetter) ?? 0) + 1,
    );
  }

  for (let index = 0; index < WORDLE_WORD_LENGTH; index += 1) {
    if (states[index] === "correct") {
      continue;
    }

    const guessLetter = normalizedGuess[index];

    if (!guessLetter) {
      continue;
    }

    const remainingCount = remainingCounts.get(guessLetter) ?? 0;

    if (remainingCount > 0) {
      states[index] = "present";
      remainingCounts.set(guessLetter, remainingCount - 1);
    }
  }

  return states;
}

function getWordleLetterPriority(state: WordleLetterState) {
  if (state === "correct") {
    return 3;
  }

  if (state === "present") {
    return 2;
  }

  return 1;
}

export function buildWordleKeyboardState(guesses: WordleEvaluatedGuess[]) {
  const keyboardState = new Map<string, WordleLetterState>();

  for (const guess of guesses) {
    guess.word.split("").forEach((letter, index) => {
      const nextState = guess.states[index];

      if (!nextState) {
        return;
      }

      const currentState = keyboardState.get(letter);

      if (
        !currentState ||
        getWordleLetterPriority(nextState) >
          getWordleLetterPriority(currentState)
      ) {
        keyboardState.set(letter, nextState);
      }
    });
  }

  return keyboardState;
}

export function calculateWordleScore({
  elapsedSeconds,
  guessCount,
}: {
  elapsedSeconds: number;
  guessCount: number;
}) {
  const guessPenalty = Math.max(0, guessCount - 1) * WORDLE_GUESS_PENALTY;
  const timePenalty = Math.round(
    (elapsedSeconds / WORDLE_PAR_SECONDS) * WORDLE_TIME_SLICE,
  );

  return Math.max(0, WORDLE_BASE_SCORE - guessPenalty - timePenalty);
}

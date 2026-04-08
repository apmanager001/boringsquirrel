import { formatAcornSweeperTime } from "@/lib/games/acornsweeper";
import { formatSudokuTime } from "@/lib/games/sudoku";
import { formatWaffleTime } from "@/lib/games/waffle";
import { formatWordSearchTime } from "@/lib/games/word-search";
import { formatWordleTime } from "@/lib/games/wordle";
import type {
  GameScoreDetails,
  SupportedScoreGameSlug,
} from "@/lib/game-scores";

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function readNumber(details: GameScoreDetails, key: string) {
  const value = details[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatGameScoreDetails(
  gameSlug: SupportedScoreGameSlug,
  details: GameScoreDetails,
) {
  if (gameSlug === "sudoku") {
    const difficulty =
      typeof details.difficulty === "string" && details.difficulty.length > 0
        ? capitalize(details.difficulty)
        : null;
    const elapsedSeconds = readNumber(details, "elapsedSeconds");
    const mistakes = readNumber(details, "mistakes");
    const parts = [
      difficulty,
      elapsedSeconds !== null ? formatSudokuTime(elapsedSeconds) : null,
      mistakes !== null ? pluralize(mistakes, "mistake") : null,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  }

  if (gameSlug === "oilcap") {
    const usefulCount = readNumber(details, "usefulCount");
    const leakCount = readNumber(details, "leakCount");
    const placementsRemaining = readNumber(details, "placementsRemaining");
    const parts = [
      usefulCount !== null ? `${usefulCount} useful` : null,
      leakCount !== null ? pluralize(leakCount, "leak") : null,
      placementsRemaining !== null ? `${placementsRemaining} left` : null,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  }

  if (gameSlug === "acornsweeper") {
    const difficulty =
      typeof details.difficulty === "string" && details.difficulty.length > 0
        ? capitalize(details.difficulty)
        : null;
    const elapsedSeconds = readNumber(details, "elapsedSeconds");
    const flagCount = readNumber(details, "flagCount");
    const acornCount = readNumber(details, "acornCount");
    const flagSummary =
      flagCount !== null && acornCount !== null
        ? `${flagCount}/${acornCount} squirrels`
        : flagCount !== null
          ? pluralize(flagCount, "squirrel")
          : null;
    const parts = [
      difficulty,
      elapsedSeconds !== null ? formatAcornSweeperTime(elapsedSeconds) : null,
      flagSummary,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  }

  if (gameSlug === "wordle") {
    const guessCount = readNumber(details, "guessCount");
    const maxGuesses = readNumber(details, "maxGuesses");
    const elapsedSeconds = readNumber(details, "elapsedSeconds");
    const parts = [
      guessCount !== null ? `${guessCount}/${maxGuesses ?? 6} guesses` : null,
      elapsedSeconds !== null ? formatWordleTime(elapsedSeconds) : null,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  }

  if (gameSlug === "waffle") {
    const swapsRemaining = readNumber(details, "swapsRemaining");
    const elapsedSeconds = readNumber(details, "elapsedSeconds");
    const completedWords = readNumber(details, "completedWords");
    const parts = [
      completedWords !== null ? `${completedWords}/6 words` : null,
      swapsRemaining !== null ? `${swapsRemaining} swaps left` : null,
      elapsedSeconds !== null ? formatWaffleTime(elapsedSeconds) : null,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  }

  if (gameSlug === "word-search") {
    const wordCount = readNumber(details, "wordCount");
    const elapsedSeconds = readNumber(details, "elapsedSeconds");
    const wrongSelections = readNumber(details, "wrongSelections");
    const parts = [
      wordCount !== null ? `${wordCount} words` : null,
      elapsedSeconds !== null ? formatWordSearchTime(elapsedSeconds) : null,
      wrongSelections !== null ? pluralize(wrongSelections, "miss") : null,
    ].filter((part): part is string => Boolean(part));

    return parts.join(" · ");
  }

  return "";
}

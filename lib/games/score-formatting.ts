import { formatAcornSweeperTime } from "@/lib/games/acornsweeper";
import { formatSudokuTime } from "@/lib/games/sudoku";
import type { GameScoreDetails, SupportedScoreGameSlug } from "@/lib/game-scores";

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

  return "";
}
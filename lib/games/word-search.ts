import { WORD_SEARCH_WORD_BANK, shuffleWords } from "@/lib/games/word-bank";
import { createSeededRandom } from "@/lib/games/daily";

export const WORD_SEARCH_GRID_SIZE = 12;
export const WORD_SEARCH_TARGET_WORD_COUNT = 8;

export type WordSearchPosition = {
  row: number;
  col: number;
};

export type WordSearchPlacement = {
  word: string;
  start: WordSearchPosition;
  rowStep: number;
  colStep: number;
  cells: WordSearchPosition[];
};

export type WordSearchPuzzle = {
  grid: string[][];
  placements: WordSearchPlacement[];
  words: string[];
  size: number;
};

const WORD_SEARCH_BASE_SCORE = 2400;
const WORD_SEARCH_PAR_SECONDS = 360;
const WORD_SEARCH_TIME_SLICE = 620;
const WORD_SEARCH_MISS_PENALTY = 90;
const fillerLetters = "eeeeeeeeaaaaiiiioooonnnnrrssttllccuummddppghbyfkvwzx";
const wordSearchDirections = [
  { rowStep: -1, colStep: 0 },
  { rowStep: 1, colStep: 0 },
  { rowStep: 0, colStep: -1 },
  { rowStep: 0, colStep: 1 },
  { rowStep: -1, colStep: -1 },
  { rowStep: -1, colStep: 1 },
  { rowStep: 1, colStep: -1 },
  { rowStep: 1, colStep: 1 },
] as const;

function createEmptyWordSearchGrid(size: number) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );
}

function isInsideGrid(size: number, row: number, col: number) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function canPlaceWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  rowStep: number,
  colStep: number,
) {
  for (let index = 0; index < word.length; index += 1) {
    const nextRow = row + rowStep * index;
    const nextCol = col + colStep * index;

    if (!isInsideGrid(grid.length, nextRow, nextCol)) {
      return false;
    }

    const currentValue = grid[nextRow]?.[nextCol] ?? "";
    const nextValue = word[index] ?? "";

    if (currentValue.length > 0 && currentValue !== nextValue) {
      return false;
    }
  }

  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  rowStep: number,
  colStep: number,
) {
  const cells: WordSearchPosition[] = [];

  for (let index = 0; index < word.length; index += 1) {
    const nextRow = row + rowStep * index;
    const nextCol = col + colStep * index;

    grid[nextRow][nextCol] = word[index] ?? "";
    cells.push({ row: nextRow, col: nextCol });
  }

  return cells;
}

function fillWordSearchGrid(grid: string[][], randomSource: () => number) {
  return grid.map((row) =>
    row.map(
      (cell) =>
        cell ||
        fillerLetters[Math.floor(randomSource() * fillerLetters.length)] ||
        "e",
    ),
  );
}

export function createWordSearchPuzzle(
  size = WORD_SEARCH_GRID_SIZE,
  targetWordCount = WORD_SEARCH_TARGET_WORD_COUNT,
  randomSource: () => number = Math.random,
): WordSearchPuzzle {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const words = shuffleWords(WORD_SEARCH_WORD_BANK, randomSource)
      .slice(0, targetWordCount)
      .sort((left, right) => right.length - left.length);
    const grid = createEmptyWordSearchGrid(size);
    const placements: WordSearchPlacement[] = [];
    let failed = false;

    for (const word of words) {
      const startingPositions = shuffleWords(
        Array.from({ length: size * size }, (_, index) => ({
          row: Math.floor(index / size),
          col: index % size,
        })),
        randomSource,
      );
      let placed = false;

      for (const direction of shuffleWords(
        wordSearchDirections,
        randomSource,
      )) {
        for (const start of startingPositions) {
          if (
            !canPlaceWord(
              grid,
              word,
              start.row,
              start.col,
              direction.rowStep,
              direction.colStep,
            )
          ) {
            continue;
          }

          placements.push({
            word,
            start,
            rowStep: direction.rowStep,
            colStep: direction.colStep,
            cells: placeWord(
              grid,
              word,
              start.row,
              start.col,
              direction.rowStep,
              direction.colStep,
            ),
          });
          placed = true;
          break;
        }

        if (placed) {
          break;
        }
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed && placements.length === words.length) {
      return {
        grid: fillWordSearchGrid(grid, randomSource),
        placements,
        words: placements.map((placement) => placement.word),
        size,
      };
    }
  }

  if (targetWordCount > 5) {
    return createWordSearchPuzzle(size, targetWordCount - 1, randomSource);
  }

  const fallbackWords = WORD_SEARCH_WORD_BANK.slice(0, 5);
  const fallbackGrid = createEmptyWordSearchGrid(size);
  const fallbackPlacements = fallbackWords.map((word, index) => ({
    word,
    start: {
      row: index * 2,
      col: 1,
    },
    rowStep: 0,
    colStep: 1,
    cells: placeWord(fallbackGrid, word, index * 2, 1, 0, 1),
  }));

  return {
    grid: fillWordSearchGrid(fallbackGrid, randomSource),
    placements: fallbackPlacements,
    words: fallbackPlacements.map((placement) => placement.word),
    size,
  };
}

export function createDailyWordSearchPuzzle(dayKey: string) {
  return createWordSearchPuzzle(
    WORD_SEARCH_GRID_SIZE,
    WORD_SEARCH_TARGET_WORD_COUNT,
    createSeededRandom(`word-search:${dayKey}`),
  );
}

export function buildWordSearchPath(
  start: WordSearchPosition,
  end: WordSearchPosition,
) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  const rowDistance = Math.abs(rowDelta);
  const colDistance = Math.abs(colDelta);

  if (rowDelta !== 0 && colDelta !== 0 && rowDistance !== colDistance) {
    return [] as WordSearchPosition[];
  }

  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const steps = Math.max(rowDistance, colDistance);

  return Array.from({ length: steps + 1 }, (_, index) => ({
    row: start.row + rowStep * index,
    col: start.col + colStep * index,
  }));
}

function positionsMatch(left: WordSearchPosition, right: WordSearchPosition) {
  return left.row === right.row && left.col === right.col;
}

export function doesWordSearchPathMatchPlacement(
  path: readonly WordSearchPosition[],
  placement: WordSearchPlacement,
) {
  if (path.length !== placement.cells.length) {
    return false;
  }

  const forwardMatch = path.every((cell, index) => {
    const targetCell = placement.cells[index];
    return Boolean(targetCell && positionsMatch(cell, targetCell));
  });

  if (forwardMatch) {
    return true;
  }

  return path.every((cell, index) => {
    const targetCell = placement.cells[placement.cells.length - 1 - index];
    return Boolean(targetCell && positionsMatch(cell, targetCell));
  });
}

export function formatWordSearchTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function calculateWordSearchScore({
  elapsedSeconds,
  wrongSelections,
  wordCount,
}: {
  elapsedSeconds: number;
  wrongSelections: number;
  wordCount: number;
}) {
  const timePenalty = Math.round(
    (elapsedSeconds / WORD_SEARCH_PAR_SECONDS) * WORD_SEARCH_TIME_SLICE,
  );
  const missPenalty = wrongSelections * WORD_SEARCH_MISS_PENALTY;

  return Math.max(
    0,
    WORD_SEARCH_BASE_SCORE + wordCount * 120 - timePenalty - missPenalty,
  );
}

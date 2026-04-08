import { WAFFLE_WORD_BANK, shuffleWords } from "@/lib/games/word-bank";
import { createSeededRandom } from "@/lib/games/daily";

export const WAFFLE_GRID_SIZE = 5;
export const WAFFLE_MAX_SWAPS = 15;

export type WafflePosition = {
  row: number;
  col: number;
};

export type WaffleGrid = Array<Array<string | null>>;

export type WafflePuzzle = {
  horizontalWords: [string, string, string];
  verticalWords: [string, string, string];
  solutionGrid: WaffleGrid;
  startGrid: WaffleGrid;
  maxSwaps: number;
};

export type WaffleTileStatus = "correct" | "present" | "absent" | "blank";

const WAFFLE_HORIZONTAL_ROWS = [0, 2, 4] as const;
const WAFFLE_VERTICAL_COLS = [0, 2, 4] as const;
const WAFFLE_BASE_SCORE = 2500;
const WAFFLE_PAR_SECONDS = 330;
const WAFFLE_TIME_SLICE = 580;
const WAFFLE_SWAP_BONUS = 150;
const WAFFLE_GENERATION_ATTEMPTS = 800;
const WAFFLE_START_SWAPS_MIN = 8;
const WAFFLE_START_SWAPS_MAX = 11;

const fallbackWordSet = {
  horizontal: ["acute", "adage", "adapt"],
  vertical: ["agama", "ulama", "eject"],
} as const;

const signatureIndex = buildSignatureIndex(WAFFLE_WORD_BANK);

function buildSignatureIndex(words: readonly string[]) {
  const index = new Map<string, string[]>();

  for (const word of words) {
    const key = `${word[0]}${word[2]}${word[4]}`;
    const bucket = index.get(key);

    if (bucket) {
      bucket.push(word);
    } else {
      index.set(key, [word]);
    }
  }

  return index;
}

function createEmptyWaffleGrid(): WaffleGrid {
  return Array.from({ length: WAFFLE_GRID_SIZE }, (_, row) =>
    Array.from({ length: WAFFLE_GRID_SIZE }, (_, col) =>
      row % 2 === 1 && col % 2 === 1 ? null : "",
    ),
  );
}

export function cloneWaffleGrid(grid: WaffleGrid) {
  return grid.map((row) => [...row]);
}

export function isWaffleFillablePosition(row: number, col: number) {
  return row % 2 === 0 || col % 2 === 0;
}

export function getWaffleFillablePositions() {
  const positions: WafflePosition[] = [];

  for (let row = 0; row < WAFFLE_GRID_SIZE; row += 1) {
    for (let col = 0; col < WAFFLE_GRID_SIZE; col += 1) {
      if (isWaffleFillablePosition(row, col)) {
        positions.push({ row, col });
      }
    }
  }

  return positions;
}

function getSignatureForColumn(words: readonly string[], col: number) {
  return `${words[0][col]}${words[1][col]}${words[2][col]}`;
}

function chooseVerticalWords(
  horizontalWords: readonly string[],
  usedWords: Set<string>,
  randomSource: () => number,
) {
  const signatureKeys = WAFFLE_VERTICAL_COLS.map((col) =>
    getSignatureForColumn(horizontalWords, col),
  );
  const options = signatureKeys.map((key) =>
    shuffleWords(
      (signatureIndex.get(key) ?? []).filter((word) => !usedWords.has(word)),
      randomSource,
    ),
  );

  if (options.some((bucket) => bucket.length === 0)) {
    return null;
  }

  const chosenWords: string[] = [];

  function backtrack(position: number): boolean {
    if (position >= options.length) {
      return true;
    }

    for (const word of options[position]) {
      if (usedWords.has(word)) {
        continue;
      }

      usedWords.add(word);
      chosenWords.push(word);

      if (backtrack(position + 1)) {
        return true;
      }

      chosenWords.pop();
      usedWords.delete(word);
    }

    return false;
  }

  return backtrack(0) ? (chosenWords as [string, string, string]) : null;
}

function generateCompatibleWordSet(randomSource: () => number) {
  for (let attempt = 0; attempt < WAFFLE_GENERATION_ATTEMPTS; attempt += 1) {
    const horizontalWords = shuffleWords(WAFFLE_WORD_BANK, randomSource).slice(
      0,
      3,
    );

    if (horizontalWords.length < 3) {
      break;
    }

    const usedWords = new Set(horizontalWords);
    const verticalWords = chooseVerticalWords(
      horizontalWords,
      usedWords,
      randomSource,
    );

    if (verticalWords) {
      return {
        horizontalWords: horizontalWords as [string, string, string],
        verticalWords,
      };
    }
  }

  return {
    horizontalWords: [...fallbackWordSet.horizontal],
    verticalWords: [...fallbackWordSet.vertical],
  } as {
    horizontalWords: [string, string, string];
    verticalWords: [string, string, string];
  };
}

function buildWaffleGrid(
  horizontalWords: readonly string[],
  verticalWords: readonly string[],
) {
  const grid = createEmptyWaffleGrid();

  WAFFLE_HORIZONTAL_ROWS.forEach((row, index) => {
    const word = horizontalWords[index] ?? "";

    for (let col = 0; col < WAFFLE_GRID_SIZE; col += 1) {
      grid[row][col] = word[col] ?? "";
    }
  });

  WAFFLE_VERTICAL_COLS.forEach((col, index) => {
    const word = verticalWords[index] ?? "";

    for (let row = 0; row < WAFFLE_GRID_SIZE; row += 1) {
      const nextLetter = word[row] ?? "";

      if (grid[row][col] === null || grid[row][col] === "") {
        grid[row][col] = nextLetter;
        continue;
      }

      if (grid[row][col] !== nextLetter) {
        throw new Error("Invalid waffle word set.");
      }
    }
  });

  return grid;
}

function getRandomDistinctPositionPair(
  positions: readonly WafflePosition[],
  grid: WaffleGrid,
  randomSource: () => number,
) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const first = positions[Math.floor(randomSource() * positions.length)];
    const second = positions[Math.floor(randomSource() * positions.length)];

    if (!first || !second) {
      continue;
    }

    if (first.row === second.row && first.col === second.col) {
      continue;
    }

    if (grid[first.row]?.[first.col] === grid[second.row]?.[second.col]) {
      continue;
    }

    return { first, second };
  }

  return null;
}

function scrambleWaffleGrid(
  solutionGrid: WaffleGrid,
  randomSource: () => number,
) {
  const positions = getWaffleFillablePositions();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const grid = cloneWaffleGrid(solutionGrid);
    const swapTarget =
      WAFFLE_START_SWAPS_MIN +
      Math.floor(
        randomSource() * (WAFFLE_START_SWAPS_MAX - WAFFLE_START_SWAPS_MIN + 1),
      );
    let appliedSwaps = 0;

    while (appliedSwaps < swapTarget) {
      const pair = getRandomDistinctPositionPair(positions, grid, randomSource);

      if (!pair) {
        break;
      }

      const nextGrid = swapWaffleLetters(grid, pair.first, pair.second);

      grid.splice(0, grid.length, ...nextGrid);
      appliedSwaps += 1;
    }

    if (!isWaffleSolved(grid, solutionGrid)) {
      return grid;
    }
  }

  const grid = cloneWaffleGrid(solutionGrid);
  const fallbackPositions = getWaffleFillablePositions();

  for (let index = 0; index < fallbackPositions.length - 1; index += 1) {
    const first = fallbackPositions[index];
    const second = fallbackPositions[index + 1];

    if (
      first &&
      second &&
      grid[first.row]?.[first.col] !== grid[second.row]?.[second.col]
    ) {
      return swapWaffleLetters(grid, first, second);
    }
  }

  return grid;
}

export function createWafflePuzzle({
  randomSource = Math.random,
}: {
  randomSource?: () => number;
} = {}): WafflePuzzle {
  const { horizontalWords, verticalWords } =
    generateCompatibleWordSet(randomSource);
  const solutionGrid = buildWaffleGrid(horizontalWords, verticalWords);

  return {
    horizontalWords,
    verticalWords,
    solutionGrid,
    startGrid: scrambleWaffleGrid(solutionGrid, randomSource),
    maxSwaps: WAFFLE_MAX_SWAPS,
  };
}

export function createDailyWafflePuzzle(dayKey: string) {
  return createWafflePuzzle({
    randomSource: createSeededRandom(`waffle:${dayKey}`),
  });
}

export function swapWaffleLetters(
  grid: WaffleGrid,
  first: WafflePosition,
  second: WafflePosition,
) {
  const nextGrid = cloneWaffleGrid(grid);
  const firstValue = nextGrid[first.row]?.[first.col];
  const secondValue = nextGrid[second.row]?.[second.col];

  if (!firstValue || !secondValue) {
    return nextGrid;
  }

  nextGrid[first.row][first.col] = secondValue;
  nextGrid[second.row][second.col] = firstValue;

  return nextGrid;
}

export function readWaffleRowWord(grid: WaffleGrid, row: number) {
  return Array.from(
    { length: WAFFLE_GRID_SIZE },
    (_, col) => grid[row]?.[col] ?? "",
  )
    .join("")
    .toLowerCase();
}

export function readWaffleColumnWord(grid: WaffleGrid, col: number) {
  return Array.from(
    { length: WAFFLE_GRID_SIZE },
    (_, row) => grid[row]?.[col] ?? "",
  )
    .join("")
    .toLowerCase();
}

export function isWaffleSolved(grid: WaffleGrid, solutionGrid: WaffleGrid) {
  return getWaffleFillablePositions().every(
    (position) =>
      grid[position.row]?.[position.col] ===
      solutionGrid[position.row]?.[position.col],
  );
}

export function countCorrectWaffleTiles(
  grid: WaffleGrid,
  solutionGrid: WaffleGrid,
) {
  return getWaffleFillablePositions().reduce(
    (count, position) =>
      count +
      (grid[position.row]?.[position.col] ===
      solutionGrid[position.row]?.[position.col]
        ? 1
        : 0),
    0,
  );
}

export function countCompletedWaffleWords(
  grid: WaffleGrid,
  horizontalWords: readonly string[],
  verticalWords: readonly string[],
) {
  const horizontalCount = WAFFLE_HORIZONTAL_ROWS.reduce<number>(
    (count, row, index) =>
      count +
      (readWaffleRowWord(grid, row) === (horizontalWords[index] ?? "") ? 1 : 0),
    0,
  );
  const verticalCount = WAFFLE_VERTICAL_COLS.reduce<number>(
    (count, col, index) =>
      count +
      (readWaffleColumnWord(grid, col) === (verticalWords[index] ?? "")
        ? 1
        : 0),
    0,
  );

  return horizontalCount + verticalCount;
}

export function getWaffleTileStatus({
  grid,
  solutionGrid,
  horizontalWords,
  verticalWords,
  row,
  col,
}: {
  grid: WaffleGrid;
  solutionGrid: WaffleGrid;
  horizontalWords: readonly string[];
  verticalWords: readonly string[];
  row: number;
  col: number;
}) {
  const currentLetter = grid[row]?.[col];

  if (!currentLetter) {
    return "blank" as const;
  }

  if (currentLetter === solutionGrid[row]?.[col]) {
    return "correct" as const;
  }

  const rowWord = row % 2 === 0 ? horizontalWords[Math.floor(row / 2)] : null;
  const colWord = col % 2 === 0 ? verticalWords[Math.floor(col / 2)] : null;

  if (rowWord?.includes(currentLetter) || colWord?.includes(currentLetter)) {
    return "present" as const;
  }

  return "absent" as const;
}

export function formatWaffleTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function calculateWaffleScore({
  elapsedSeconds,
  swapsUsed,
}: {
  elapsedSeconds: number;
  swapsUsed: number;
}) {
  const swapsRemaining = Math.max(0, WAFFLE_MAX_SWAPS - swapsUsed);
  const timePenalty = Math.round(
    (elapsedSeconds / WAFFLE_PAR_SECONDS) * WAFFLE_TIME_SLICE,
  );

  return Math.max(
    0,
    WAFFLE_BASE_SCORE + swapsRemaining * WAFFLE_SWAP_BONUS - timePenalty,
  );
}

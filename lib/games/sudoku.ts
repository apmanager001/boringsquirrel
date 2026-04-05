export type SudokuDifficulty = "easy" | "medium" | "hard";
export type SudokuGrid = number[][];

export type SudokuPuzzle = {
  difficulty: SudokuDifficulty;
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  givens: boolean[][];
  clueCount: number;
};

type DifficultyConfig = {
  label: string;
  clueTarget: number;
  description: string;
  baseScore: number;
  parSeconds: number;
  speedMultiplier: number;
  mistakePenalty: number;
};

const GRID_SIZE = 9;
const BOX_SIZE = 3;
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const difficultyConfig: Record<SudokuDifficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    clueTarget: 40,
    description: "More givens, faster progress, and a softer score curve.",
    baseScore: 1600,
    parSeconds: 720,
    speedMultiplier: 2,
    mistakePenalty: 140,
  },
  medium: {
    label: "Medium",
    clueTarget: 33,
    description:
      "A balanced board with enough pressure to reward clean solves.",
    baseScore: 2600,
    parSeconds: 960,
    speedMultiplier: 3,
    mistakePenalty: 180,
  },
  hard: {
    label: "Hard",
    clueTarget: 28,
    description: "Sparse givens, slower tempo, and the biggest score upside.",
    baseScore: 3600,
    parSeconds: 1320,
    speedMultiplier: 4,
    mistakePenalty: 240,
  },
};

function shuffle<T>(items: T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = nextItems[index];

    nextItems[index] = nextItems[swapIndex]!;
    nextItems[swapIndex] = current!;
  }

  return nextItems;
}

export function cloneSudokuGrid(grid: SudokuGrid) {
  return grid.map((row) => [...row]);
}

export function createEmptySudokuGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0),
  );
}

export function getSudokuDifficultyConfig(difficulty: SudokuDifficulty) {
  return difficultyConfig[difficulty];
}

export function formatSudokuTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function pattern(row: number, col: number) {
  return (
    (BOX_SIZE * (row % BOX_SIZE) + Math.floor(row / BOX_SIZE) + col) % GRID_SIZE
  );
}

function buildSolvedGrid() {
  const groups = [0, 1, 2];
  const rows = shuffle(groups).flatMap((group) =>
    shuffle(groups).map((index) => group * BOX_SIZE + index),
  );
  const cols = shuffle(groups).flatMap((group) =>
    shuffle(groups).map((index) => group * BOX_SIZE + index),
  );
  const symbols = shuffle([...digits]);

  return rows.map((row) => cols.map((col) => symbols[pattern(row, col)]!));
}

function collectHouseValues(board: SudokuGrid, row: number, col: number) {
  const usedValues = new Set<number>();

  for (let index = 0; index < GRID_SIZE; index += 1) {
    if (board[row]?.[index]) {
      usedValues.add(board[row][index]!);
    }

    if (board[index]?.[col]) {
      usedValues.add(board[index][col]!);
    }
  }

  const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxColStart = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let rowOffset = 0; rowOffset < BOX_SIZE; rowOffset += 1) {
    for (let colOffset = 0; colOffset < BOX_SIZE; colOffset += 1) {
      const boxValue =
        board[boxRowStart + rowOffset]?.[boxColStart + colOffset];

      if (boxValue) {
        usedValues.add(boxValue);
      }
    }
  }

  return usedValues;
}

export function getSudokuCandidates(
  board: SudokuGrid,
  row: number,
  col: number,
) {
  if (board[row]?.[col]) {
    return [];
  }

  const usedValues = collectHouseValues(board, row, col);

  return digits.filter((digit) => !usedValues.has(digit));
}

export function getSudokuPeerPositions(row: number, col: number) {
  const positions = new Set<string>();

  for (let index = 0; index < GRID_SIZE; index += 1) {
    if (index !== col) {
      positions.add(`${row}:${index}`);
    }

    if (index !== row) {
      positions.add(`${index}:${col}`);
    }
  }

  const boxRowStart = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxColStart = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let rowOffset = 0; rowOffset < BOX_SIZE; rowOffset += 1) {
    for (let colOffset = 0; colOffset < BOX_SIZE; colOffset += 1) {
      const peerRow = boxRowStart + rowOffset;
      const peerCol = boxColStart + colOffset;

      if (peerRow !== row || peerCol !== col) {
        positions.add(`${peerRow}:${peerCol}`);
      }
    }
  }

  return Array.from(positions, (value) => {
    const [peerRow, peerCol] = value.split(":");
    return {
      row: Number(peerRow),
      col: Number(peerCol),
    };
  });
}

function findBestEmptyCell(board: SudokuGrid) {
  let bestCell: {
    row: number;
    col: number;
    candidates: number[];
  } | null = null;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row]?.[col]) {
        continue;
      }

      const candidates = getSudokuCandidates(board, row, col);

      if (candidates.length === 0) {
        return {
          row,
          col,
          candidates,
        };
      }

      if (!bestCell || candidates.length < bestCell.candidates.length) {
        bestCell = {
          row,
          col,
          candidates,
        };
      }

      if (bestCell && bestCell.candidates.length === 1) {
        return bestCell;
      }
    }
  }

  return bestCell;
}

function countSolutions(board: SudokuGrid, limit = 2): number {
  const nextCell = findBestEmptyCell(board);

  if (!nextCell) {
    return 1;
  }

  if (nextCell.candidates.length === 0) {
    return 0;
  }

  let total = 0;

  for (const candidate of shuffle(nextCell.candidates)) {
    board[nextCell.row][nextCell.col] = candidate;
    total += countSolutions(board, limit - total);

    if (total >= limit) {
      board[nextCell.row][nextCell.col] = 0;
      return total;
    }
  }

  board[nextCell.row][nextCell.col] = 0;
  return total;
}

function buildPuzzleFromSolution(
  solution: SudokuGrid,
  difficulty: SudokuDifficulty,
) {
  const config = getSudokuDifficultyConfig(difficulty);
  const puzzle = cloneSudokuGrid(solution);
  const positions = shuffle(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE,
    })),
  );
  let clueCount = GRID_SIZE * GRID_SIZE;

  for (const position of positions) {
    if (clueCount <= config.clueTarget) {
      break;
    }

    const currentValue = puzzle[position.row][position.col];

    if (!currentValue) {
      continue;
    }

    puzzle[position.row][position.col] = 0;

    if (countSolutions(cloneSudokuGrid(puzzle), 2) !== 1) {
      puzzle[position.row][position.col] = currentValue;
      continue;
    }

    clueCount -= 1;
  }

  return {
    puzzle,
    clueCount,
  };
}

export function createSudokuPuzzle(difficulty: SudokuDifficulty): SudokuPuzzle {
  const solution = buildSolvedGrid();
  const { puzzle, clueCount } = buildPuzzleFromSolution(solution, difficulty);

  return {
    difficulty,
    puzzle,
    solution,
    givens: puzzle.map((row) => row.map((value) => value !== 0)),
    clueCount,
  };
}

export function getSudokuFilledCount(board: SudokuGrid) {
  return board.flat().filter((value) => value !== 0).length;
}

export function isSudokuSolved(board: SudokuGrid, solution: SudokuGrid) {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (board[row]?.[col] !== solution[row]?.[col]) {
        return false;
      }
    }
  }

  return true;
}

export function calculateSudokuScore({
  difficulty,
  elapsedSeconds,
  mistakes,
}: {
  difficulty: SudokuDifficulty;
  elapsedSeconds: number;
  mistakes: number;
}) {
  const config = getSudokuDifficultyConfig(difficulty);
  const timePenalty = Math.round(
    (elapsedSeconds / config.parSeconds) *
      (config.baseScore / config.speedMultiplier),
  );
  const mistakePenalty = mistakes * config.mistakePenalty;

  return Math.max(0, config.baseScore - timePenalty - mistakePenalty);
}

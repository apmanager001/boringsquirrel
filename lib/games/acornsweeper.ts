export type AcornSweeperDifficulty = "easy" | "medium" | "hard";

export type AcornSweeperCell = {
  hasAcorn: boolean;
  adjacentAcorns: number;
  revealed: boolean;
  flagged: boolean;
  exploded: boolean;
};

export type AcornSweeperBoard = AcornSweeperCell[][];

type DifficultyConfig = {
  label: string;
  rows: number;
  cols: number;
  acornCount: number;
  description: string;
  baseScore: number;
  parSeconds: number;
  speedMultiplier: number;
};

const difficultyConfig: Record<AcornSweeperDifficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    rows: 9,
    cols: 9,
    acornCount: 10,
    description:
      "A compact field with a forgiving acorn count and a fast pace.",
    baseScore: 1600,
    parSeconds: 180,
    speedMultiplier: 1.9,
  },
  medium: {
    label: "Medium",
    rows: 12,
    cols: 12,
    acornCount: 24,
    description:
      "A broader clearing that asks for cleaner flag reads and steadier tempo.",
    baseScore: 2600,
    parSeconds: 360,
    speedMultiplier: 2.5,
  },
  hard: {
    label: "Hard",
    rows: 16,
    cols: 16,
    acornCount: 40,
    description:
      "A dense grid where efficient scanning matters as much as nerve.",
    baseScore: 3600,
    parSeconds: 600,
    speedMultiplier: 3.2,
  },
};

function createHiddenCell(): AcornSweeperCell {
  return {
    hasAcorn: false,
    adjacentAcorns: 0,
    revealed: false,
    flagged: false,
    exploded: false,
  };
}

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

function keyForCell(row: number, col: number) {
  return `${row}:${col}`;
}

function isInsideBoard(row: number, col: number, rows: number, cols: number) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function getAdjacentPositions(
  row: number,
  col: number,
  rows: number,
  cols: number,
) {
  const positions: Array<{ row: number; col: number }> = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (isInsideBoard(nextRow, nextCol, rows, cols)) {
        positions.push({ row: nextRow, col: nextCol });
      }
    }
  }

  return positions;
}

function getSafeZoneKeys(row: number, col: number, rows: number, cols: number) {
  return new Set([
    keyForCell(row, col),
    ...getAdjacentPositions(row, col, rows, cols).map((position) =>
      keyForCell(position.row, position.col),
    ),
  ]);
}

function countAdjacentAcorns(
  board: AcornSweeperBoard,
  row: number,
  col: number,
) {
  return getAdjacentPositions(
    row,
    col,
    board.length,
    board[0]?.length ?? 0,
  ).reduce(
    (count, position) =>
      count + (board[position.row]?.[position.col]?.hasAcorn ? 1 : 0),
    0,
  );
}

export function getAcornSweeperDifficultyConfig(
  difficulty: AcornSweeperDifficulty,
) {
  return difficultyConfig[difficulty];
}

export function formatAcornSweeperTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function createAcornSweeperBoard(
  difficulty: AcornSweeperDifficulty,
): AcornSweeperBoard {
  const { rows, cols } = getAcornSweeperDifficultyConfig(difficulty);

  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createHiddenCell()),
  );
}

export function cloneAcornSweeperBoard(board: AcornSweeperBoard) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function armAcornSweeperBoard(
  board: AcornSweeperBoard,
  difficulty: AcornSweeperDifficulty,
  safeRow: number,
  safeCol: number,
) {
  const { rows, cols, acornCount } =
    getAcornSweeperDifficultyConfig(difficulty);
  const nextBoard = board.map((row) =>
    row.map((cell) => ({
      ...createHiddenCell(),
      flagged: cell.flagged,
      revealed: cell.revealed,
    })),
  );
  const safeZoneKeys = getSafeZoneKeys(safeRow, safeCol, rows, cols);
  const candidatePositions = Array.from(
    { length: rows * cols },
    (_, index) => ({
      row: Math.floor(index / cols),
      col: index % cols,
    }),
  );
  const safeFallbackKeys = new Set([keyForCell(safeRow, safeCol)]);
  const availablePositions = candidatePositions.filter(
    (position) => !safeZoneKeys.has(keyForCell(position.row, position.col)),
  );
  const sourcePositions =
    availablePositions.length >= acornCount
      ? availablePositions
      : candidatePositions.filter(
          (position) =>
            !safeFallbackKeys.has(keyForCell(position.row, position.col)),
        );

  for (const position of shuffle(sourcePositions).slice(0, acornCount)) {
    nextBoard[position.row][position.col].hasAcorn = true;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (nextBoard[row][col].hasAcorn) {
        continue;
      }

      nextBoard[row][col].adjacentAcorns = countAdjacentAcorns(
        nextBoard,
        row,
        col,
      );
    }
  }

  return nextBoard;
}

export function toggleAcornSweeperFlag(
  board: AcornSweeperBoard,
  row: number,
  col: number,
) {
  const nextBoard = cloneAcornSweeperBoard(board);
  const cell = nextBoard[row]?.[col];

  if (!cell || cell.revealed) {
    return board;
  }

  cell.flagged = !cell.flagged;

  return nextBoard;
}

export function revealAcornSweeperArea(
  board: AcornSweeperBoard,
  row: number,
  col: number,
) {
  const nextBoard = cloneAcornSweeperBoard(board);
  const targetCell = nextBoard[row]?.[col];

  if (!targetCell || targetCell.flagged || targetCell.revealed) {
    return {
      board: nextBoard,
      detonated: false,
      safeRevealedCount: 0,
    };
  }

  if (targetCell.hasAcorn) {
    targetCell.revealed = true;
    targetCell.exploded = true;

    return {
      board: nextBoard,
      detonated: true,
      safeRevealedCount: 0,
    };
  }

  let safeRevealedCount = 0;
  const queue: Array<{ row: number; col: number }> = [{ row, col }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = keyForCell(current.row, current.col);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);

    const cell = nextBoard[current.row]?.[current.col];

    if (!cell || cell.revealed || cell.flagged || cell.hasAcorn) {
      continue;
    }

    cell.revealed = true;
    safeRevealedCount += 1;

    if (cell.adjacentAcorns !== 0) {
      continue;
    }

    for (const position of getAdjacentPositions(
      current.row,
      current.col,
      nextBoard.length,
      nextBoard[0]?.length ?? 0,
    )) {
      queue.push(position);
    }
  }

  return {
    board: nextBoard,
    detonated: false,
    safeRevealedCount,
  };
}

export function revealAllAcorns(
  board: AcornSweeperBoard,
  explodedRow?: number,
  explodedCol?: number,
) {
  const nextBoard = cloneAcornSweeperBoard(board);

  for (let row = 0; row < nextBoard.length; row += 1) {
    for (let col = 0; col < (nextBoard[row]?.length ?? 0); col += 1) {
      const cell = nextBoard[row][col];

      if (!cell.hasAcorn) {
        continue;
      }

      cell.revealed = true;
      cell.exploded = row === explodedRow && col === explodedCol;
    }
  }

  return nextBoard;
}

export function finishWinningAcornSweeperBoard(board: AcornSweeperBoard) {
  const nextBoard = cloneAcornSweeperBoard(board);

  for (let row = 0; row < nextBoard.length; row += 1) {
    for (let col = 0; col < (nextBoard[row]?.length ?? 0); col += 1) {
      const cell = nextBoard[row][col];

      if (cell.hasAcorn) {
        cell.flagged = true;
      }
    }
  }

  return nextBoard;
}

export function countAcornSweeperFlags(board: AcornSweeperBoard) {
  return board.flat().filter((cell) => cell.flagged).length;
}

export function countAcornSweeperRevealedSafeCells(board: AcornSweeperBoard) {
  return board.flat().filter((cell) => cell.revealed && !cell.hasAcorn).length;
}

export function isAcornSweeperSolved(board: AcornSweeperBoard) {
  return board.flat().every((cell) => cell.hasAcorn || cell.revealed);
}

export function calculateAcornSweeperScore({
  difficulty,
  elapsedSeconds,
}: {
  difficulty: AcornSweeperDifficulty;
  elapsedSeconds: number;
}) {
  const config = getAcornSweeperDifficultyConfig(difficulty);
  const timePenalty = Math.round(
    (elapsedSeconds / config.parSeconds) *
      (config.baseScore / config.speedMultiplier),
  );

  return Math.max(0, config.baseScore - timePenalty);
}

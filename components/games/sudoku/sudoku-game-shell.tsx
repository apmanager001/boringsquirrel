import { SudokuGame } from "@/components/games/sudoku/sudoku-game";
import { createSudokuPuzzle } from "@/lib/games/sudoku";

export function SudokuGameShell() {
  return <SudokuGame initialPuzzle={createSudokuPuzzle("medium")} />;
}

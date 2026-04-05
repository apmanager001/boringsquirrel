"use client";

import dynamic from "next/dynamic";

const SudokuGame = dynamic(
  () =>
    import("@/components/games/sudoku-game").then(
      (module) => module.SudokuGame,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="card-surface rounded-4xl p-4 sm:p-6">
        <div className="flex min-h-[544px] items-center justify-center rounded-4xl border border-base-300/15 bg-white/35 p-8 text-center">
          <div className="max-w-md space-y-3">
            <p className="section-kicker before:hidden">Loading board</p>
            <h2 className="display-font text-3xl font-semibold">
              Shuffling a fresh puzzle
            </h2>
            <p className="text-sm leading-7 text-base-content/78">
              Generating a unique Sudoku board before the interactive grid
              mounts.
            </p>
          </div>
        </div>
      </div>
    ),
  },
);

export function SudokuGameShell() {
  return <SudokuGame />;
}

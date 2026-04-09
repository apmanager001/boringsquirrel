"use client";

import dynamic from "next/dynamic";

const AcornSweeperGame = dynamic(
  () =>
    import("@/components/games/acornsweeper/acornsweeper-game").then(
      (module) => module.AcornSweeperGame,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="card-surface rounded-4xl p-4 sm:p-6">
        <div className="flex min-h-34rem items-center justify-center rounded-[1.8rem] border border-base-300/15 bg-white/35 p-8 text-center">
          <div className="max-w-md space-y-3">
            <p className="section-kicker before:hidden">Loading field</p>
            <h2 className="display-font text-3xl font-semibold">
              Scattering the acorns
            </h2>
            <p className="text-sm leading-7 text-base-content/78">
              Preparing a fresh clearing before the interactive board mounts.
            </p>
          </div>
        </div>
      </div>
    ),
  },
);

export function AcornSweeperGameShell() {
  return <AcornSweeperGame />;
}

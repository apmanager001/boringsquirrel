"use client";

import dynamic from "next/dynamic";

const OilcapGame = dynamic(
  () =>
    import("@/components/games/oilcap-game").then(
      (module) => module.OilcapGame,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="card-surface rounded-4xl p-4 sm:p-6">
        <div className="flex min-h-[34rem] items-center justify-center rounded-[1.8rem] border border-base-300/15 bg-white/35 p-8 text-center">
          <div className="max-w-md space-y-3">
            <p className="section-kicker before:hidden">Loading run</p>
            <h2 className="display-font text-3xl font-semibold">
              Priming the pipeline
            </h2>
            <p className="text-sm leading-7 text-base-content/78">
              Preparing a fresh delivery route and queue of random pipe pieces.
            </p>
          </div>
        </div>
      </div>
    ),
  },
);

export function OilcapGameShell() {
  return <OilcapGame />;
}

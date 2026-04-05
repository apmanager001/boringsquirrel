import {
  CheckCircle2,
  Sparkles,
  Squirrel,
  TriangleAlert,
} from "lucide-react";

type DifficultyDetails = {
  label: string;
  description: string;
  baseScore: number;
  acornCount: number;
  rows: number;
  cols: number;
};

type AcornSweeperAboveBoardProps = {
  game: {
    status: "ready" | "playing" | "won" | "lost";
    flagMode: boolean;
  };
  difficultyDetails: DifficultyDetails;
  statusTitle: string;
  statusBody: string;
  flagCount: number;
  onToggleFlagMode: () => void;
};

export function AcornSweeperAboveBoard({
  game,
  difficultyDetails,
  statusTitle,
  statusBody,
  flagCount,
  onToggleFlagMode,
}: AcornSweeperAboveBoardProps) {
  const statusIcon =
    game.status === "won" ? (
      <CheckCircle2 className="size-5 shrink-0 text-success" />
    ) : game.status === "lost" ? (
      <TriangleAlert className="size-5 shrink-0 text-error" />
    ) : game.flagMode ? (
      <Squirrel className="size-5 shrink-0 text-accent" />
    ) : (
      <Sparkles className="size-5 shrink-0 text-primary" />
    );

  return (
    <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(13rem,0.72fr)] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="section-kicker before:w-4">Difficulty</p>
            <Sparkles className="size-4 shrink-0 text-accent" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="display-font text-lg font-semibold sm:text-xl">
              {difficultyDetails.label}
            </h3>
            <div className="flex w-full flex-wrap gap-2">
              <span className="rounded-full bg-base-100/75 px-2.5 py-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-base-content/65">
                Base {difficultyDetails.baseScore}
              </span>
              <span className="rounded-full bg-base-100/75 px-2.5 py-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-base-content/65">
                {difficultyDetails.rows} x {difficultyDetails.cols}
              </span>
              <span className="rounded-full bg-base-100/75 px-2.5 py-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-base-content/65">
                {difficultyDetails.acornCount} acorns
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-base-content/76">
            {difficultyDetails.description}
          </p>
        </div>

        <div className="min-w-0 border-t border-base-300/15 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <div className="flex items-start gap-2 rounded-2xl bg-base-100/70 px-3 py-2.5">
            {statusIcon}
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-base-content/55">
                Run status
              </p>
              <p className="mt-0.5 text-sm font-semibold text-base-content sm:text-[0.95rem]">
                {statusTitle}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-base-content/76">
            {statusBody}
          </p>
        </div>

        <div className="flex h-full flex-col items-start justify-center gap-3 border-t border-base-300/15 pt-4 lg:items-end lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <button
            type="button"
            onClick={onToggleFlagMode}
            className={`btn rounded-full ${
              game.flagMode
                ? "btn-primary"
                : "border border-base-300/20 bg-base-100/75 text-base-content hover:bg-base-100"
            }`}
          >
            <Squirrel className="size-4" />
            {game.flagMode ? "Flag mode on" : "Flag mode off"}
          </button>

          <p className="max-w-full rounded-2xl bg-base-100/75 px-3 py-2 text-xs font-medium leading-5 text-base-content/72 sm:text-sm lg:max-w-xs">
            Right-click always places a squirrel flag. On touch, turn on flag
            mode before tapping. Flags placed: {flagCount}.
          </p>
        </div>
      </div>
    </div>
  );
}
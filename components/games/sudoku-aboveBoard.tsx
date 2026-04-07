import {
  CheckCircle2,
  Keyboard,
  NotebookPen,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

type DifficultyDetails = {
  label: string;
  description: string;
  baseScore: number;
  mistakePenalty: number;
};

type SudokuAboveBoardProps = {
  game: {
    status: "playing" | "solved";
    errorCell: {
      row: number;
      col: number;
    } | null;
    noteMode: boolean;
  };
  showHint: boolean;
  selectedCandidates: number[];
  difficultyDetails: DifficultyDetails;
  statusTitle: string;
  statusBody: string;
  onToggleHint: () => void;
  compact?: boolean;
};

function SudokuAboveBoard({
  game,
  showHint,
  selectedCandidates,
  difficultyDetails,
  statusTitle,
  statusBody,
  onToggleHint,
  compact = false,
}: SudokuAboveBoardProps) {
  const hintText = showHint
    ? selectedCandidates.length > 0
      ? selectedCandidates.join(", ")
      : "Square is solved!"
    : "Select an empty square.";

  const statusIcon =
    game.status === "solved" ? (
      <CheckCircle2 className="size-5 shrink-0 text-success" />
    ) : game.errorCell ? (
      <TriangleAlert className="size-5 shrink-0 text-error" />
    ) : game.noteMode ? (
      <NotebookPen className="size-5 shrink-0 text-primary" />
    ) : (
      <Keyboard className="size-5 shrink-0 text-primary" />
    );

  const containerClassName = compact
    ? "rounded-[1.35rem] border border-base-300/15 bg-white/50 p-4"
    : "rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5";
  const gridClassName = compact
    ? "grid gap-4"
    : "grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(13rem,0.7fr)] lg:items-start";
  const statusSectionClassName = compact
    ? "min-w-0 border-t border-base-300/15 pt-4"
    : "min-w-0 border-t border-base-300/15 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0";
  const hintSectionClassName = compact
    ? "flex flex-col gap-2 border-t border-base-300/15 pt-4"
    : "flex h-full flex-col items-start justify-center gap-2 border-t border-base-300/15 pt-4 lg:items-end lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0";
  const hintTextClassName = compact
    ? "max-w-full rounded-2xl bg-base-100/75 px-3 py-2 text-xs font-medium leading-5 text-base-content/72"
    : "max-w-full rounded-2xl bg-base-100/75 px-3 py-2 text-xs font-medium leading-5 text-base-content/72 sm:text-sm lg:max-w-xs";

  return (
    <div className={containerClassName}>
      <div className={gridClassName}>
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
              <span className="text-center rounded-full bg-base-100/75 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-base-content/65">
                Base {difficultyDetails.baseScore}
              </span>
              <span className="text-center rounded-full bg-base-100/75 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-base-content/65">
                Mistake -{difficultyDetails.mistakePenalty}
              </span>
              <span className="text-center rounded-full bg-base-100/75 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-base-content/65">
                {game.noteMode ? "Pencil mode" : "Final entries"}
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-base-content/76">
            {difficultyDetails.description}
          </p>
        </div>

        <div className={statusSectionClassName}>
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

        <div className={hintSectionClassName}>
          <label
            htmlFor="sudoku-hint-toggle"
            className="flex items-center gap-3 rounded-full bg-base-100/75 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-base-content/65"
          >
            Show Hints
            <input
              id="sudoku-hint-toggle"
              onChange={() => onToggleHint()}
              type="checkbox"
              checked={showHint}
              className="toggle toggle-primary toggle-sm"
            />
          </label>

          <p className={hintTextClassName}>{hintText}</p>
        </div>
      </div>
    </div>
  );
}

export default SudokuAboveBoard;

import type { ReactNode } from "react";
import { Trophy } from "lucide-react";

export type GameScoreStat = {
  label: string;
  value: ReactNode;
};

type GameScoresProps = {
  title?: string;
  score: ReactNode;
  stats: GameScoreStat[];
  compact?: boolean;
};

function GameScores({
  title = "Score",
  score,
  stats,
  compact = false,
}: GameScoresProps) {
  const cardClassName = compact
    ? "rounded-[1.35rem] border border-primary/15 bg-white/50 p-4"
    : "rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5";
  const iconClassName = compact ? "size-6 text-primary" : "size-7 text-primary";
  const scoreClassName = compact
    ? "display-font mt-2 text-4xl font-semibold text-base-content"
    : "display-font mt-2 text-5xl font-semibold text-base-content";
  const gridClassName = compact
    ? "mt-4 grid grid-cols-2 gap-2"
    : "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2";
  const statCardClassName = compact
    ? "rounded-[1rem] bg-base-100/80 p-3"
    : "rounded-[1.2rem] bg-base-100/70 p-4";
  const statLabelClassName = compact
    ? "text-[0.65rem] uppercase tracking-[0.26em] text-base-content/45"
    : "text-xs uppercase tracking-[0.3em] text-base-content/45";
  const statValueClassName = compact
    ? "mt-1 text-xl font-semibold"
    : "mt-2 text-2xl font-semibold";

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-base-content/45">
            {title}
          </p>
          <p className={scoreClassName}>{score}</p>
        </div>
        <Trophy className={iconClassName} />
      </div>

      {stats.length > 0 ? (
        <div className={gridClassName}>
          {stats.map(({ label, value }, index) => (
            <div key={`${label}-${index}`} className={statCardClassName}>
              <p className={statLabelClassName}>{label}</p>
              <p className={statValueClassName}>{value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default GameScores;

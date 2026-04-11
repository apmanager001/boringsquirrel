"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCcw, X } from "lucide-react";
import GameScores, { type GameScoreStat } from "@/components/games/gameScores";
import {
  ScorePanel,
  type ScorePanelProps,
} from "@/components/games/score-panel";

type GameOverModalProps = {
  isComplete: boolean;
  completionKey: string | number;
  title: string;
  description: string;
  gameLabel: string;
  score: ReactNode;
  stats: GameScoreStat[];
  scorePanelProps: ScorePanelProps;
  restartLabel?: string;
  onRestart?: () => void;
};

export function GameOverModal({
  isComplete,
  completionKey,
  title,
  description,
  gameLabel,
  score,
  stats,
  scorePanelProps,
  restartLabel = "Play again",
  onRestart,
}: GameOverModalProps) {
  const [dismissedCompletionKey, setDismissedCompletionKey] = useState<
    string | number | null
  >(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = isComplete && dismissedCompletionKey !== completionKey;
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDismissedCompletionKey(completionKey);
      }
    };

    const originalOverflow = document.body.style.overflow;
    const frameId = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [completionKey, isOpen]);

  if (!isOpen || !portalTarget) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setDismissedCompletionKey(completionKey)}
        className="fixed inset-0 z-90 bg-neutral/35 backdrop-blur-sm transition-opacity duration-200"
        aria-label={`Close ${gameLabel} game over summary`}
      />
      <div className="fixed inset-0 z-91 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${gameLabel} game over summary`}
            className="flex max-h-[min(92vh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-4xl border border-base-300/80 bg-base-100/96 shadow-[0_28px_80px_rgba(15,25,12,0.28)] backdrop-blur-2xl"
          >
            <div className="border-b border-base-300/12 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="section-kicker before:w-4">Run complete</p>
                  <h2 className="display-font mt-3 text-3xl font-semibold text-base-content sm:text-4xl">
                    {title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-base-content/78">
                    {description}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setDismissedCompletionKey(completionKey)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-base-300/16 bg-white/70 text-base-content/78 hover:bg-white hover:text-base-content cursor-pointer"
                  aria-label={`Close ${gameLabel} game over summary`}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:items-start">
                <GameScores title="Final score" score={score} stats={stats} />
                <ScorePanel
                  {...scorePanelProps}
                  compact
                  showLeaderboard={false}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-base-300/12 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setDismissedCompletionKey(completionKey)}
                className="btn rounded-full border border-base-300/20 bg-base-100/75 hover:bg-base-100"
              >
                Back to game
              </button>
              {onRestart ? (
                <button
                  type="button"
                  onClick={() => {
                    setDismissedCompletionKey(completionKey);
                    onRestart();
                  }}
                  className="btn btn-primary rounded-full"
                >
                  <RefreshCcw className="size-4" />
                  {restartLabel}
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </>,
    portalTarget,
  );
}

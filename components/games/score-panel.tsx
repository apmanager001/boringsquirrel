"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  BadgeCheck,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { formatGameScoreDetails } from "@/lib/games/score-formatting";
import type {
  GameScoreDetails,
  RankedGameScore,
  SavedGameScore,
  SupportedScoreGameSlug,
} from "@/lib/game-scores";

type FeatureAuthState = "disabled" | "guest" | "unverified" | "verified";

type ScoreboardResponse = {
  available: boolean;
  authState: FeatureAuthState;
  leaderboard: RankedGameScore[];
  viewerBest: SavedGameScore | null;
  message: string | null;
};

type ScorePanelProps = {
  gameSlug: SupportedScoreGameSlug;
  score: number;
  details: GameScoreDetails;
  canSubmit: boolean;
};

export function ScorePanel({
  gameSlug,
  score,
  details,
  canSubmit,
}: ScorePanelProps) {
  const [scoreboard, setScoreboard] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitPending, startSubmitTransition] = useTransition();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadScoreboard() {
      setLoading(true);

      try {
        const response = await fetch(`/api/games/${gameSlug}/scores?limit=5`, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const data = (await response.json()) as Partial<ScoreboardResponse> & {
          message?: string | null;
        };

        if (abortController.signal.aborted) {
          return;
        }

        setScoreboard({
          available: data.available ?? false,
          authState: data.authState ?? "disabled",
          leaderboard: data.leaderboard ?? [],
          viewerBest: data.viewerBest ?? null,
          message: data.message ?? null,
        });
        setFeedback(data.message ?? null);
      } catch {
        if (!abortController.signal.aborted) {
          setFeedback("Could not load the leaderboard right now.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadScoreboard();

    return () => {
      abortController.abort();
    };
  }, [gameSlug]);

  const currentBest = scoreboard?.viewerBest;
  const candidateDetails = formatGameScoreDetails(gameSlug, details);
  const improvementAvailable =
    canSubmit && score > 0 && (!currentBest || score > currentBest.score);
  const loginHref = `/login?callbackURL=/games/${gameSlug}`;

  function handleSaveScore() {
    if (!improvementAvailable || submitPending) {
      return;
    }

    startSubmitTransition(async () => {
      try {
        const response = await fetch(`/api/games/${gameSlug}/scores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score,
            details,
          }),
        });
        const data = (await response.json()) as Partial<ScoreboardResponse> & {
          message?: string | null;
        };

        if (!response.ok) {
          setFeedback(data.message ?? "Could not save this score.");

          const nextAuthState = data.authState;

          if (nextAuthState) {
            setScoreboard((current) =>
              current
                ? {
                    ...current,
                    authState: nextAuthState,
                  }
                : current,
            );
          }

          return;
        }

        setScoreboard({
          available: data.available ?? true,
          authState: data.authState ?? "verified",
          leaderboard: data.leaderboard ?? [],
          viewerBest: data.viewerBest ?? null,
          message: data.message ?? null,
        });
        setFeedback(data.message ?? "Score saved.");
      } catch {
        setFeedback("Could not save this score right now.");
      }
    });
  }

  const statusCopy = loading
    ? "Loading the verified leaderboard."
    : scoreboard?.authState === "disabled"
      ? "Authentication is offline in this environment, so score saving is unavailable."
      : scoreboard?.authState === "guest"
        ? "Guests can play freely. Verified accounts can save their best runs here."
        : scoreboard?.authState === "unverified"
          ? "Your account is signed in, but email verification is still required for saved scores."
          : canSubmit
            ? improvementAvailable
              ? "This run is ready to submit as your saved best."
              : "Your saved best is already higher than this run."
            : "Finish the current run to submit a score to the leaderboard.";

  return (
    <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker before:w-4">Leaderboard</p>
          <h3 className="display-font text-2xl font-semibold">
            Verified best runs
          </h3>
        </div>
        <Trophy className="size-6 text-secondary" />
      </div>

      <p className="mt-4 text-sm leading-7 text-base-content/78">
        {statusCopy}
      </p>
      {scoreboard?.authState === "verified" && (
        <div className="mt-4 rounded-[1.2rem] bg-base-100/72 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-base-content/45">
            Your saved best
          </p>
          <p className="display-font mt-2 text-3xl font-semibold text-base-content">
            {currentBest ? currentBest.score : "-"}
          </p>
          <p className="mt-2 text-sm leading-6 text-base-content/72">
            {currentBest
              ? formatGameScoreDetails(gameSlug, currentBest.details) ||
                "Verified score on file."
              : "No verified score saved for this game yet."}
          </p>
        </div>
      )}

      {feedback ? (
        <div className="mt-4 rounded-[1.2rem] border border-base-300/20 bg-white/50 px-4 py-3 text-sm leading-7 text-base-content/78">
          {feedback}
        </div>
      ) : null}

      <div className="mt-4">
        {scoreboard?.authState === "verified" ? (
          canSubmit ? (
            improvementAvailable ? (
              <button
                type="button"
                onClick={handleSaveScore}
                disabled={submitPending}
                className="btn btn-primary w-full rounded-full"
              >
                {submitPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <BadgeCheck className="size-4" />
                )}
                {submitPending
                  ? "Saving score..."
                  : `Save ${score}${
                      candidateDetails ? ` · ${candidateDetails}` : ""
                    }`}
              </button>
            ) : (
              <div className="rounded-[1.2rem] border border-base-300/20 bg-white/50 px-4 py-3 text-sm leading-7 text-base-content/78">
                Keep pushing. This run did not beat your saved best of{" "}
                {currentBest?.score ?? 0}.
              </div>
            )
          ) : null
        ) : scoreboard?.authState === "guest" ? (
          <Link
            href={loginHref}
            className="btn btn-primary w-full rounded-full"
          >
            <LogIn className="size-4" />
            Log in to save scores
          </Link>
        ) : scoreboard?.authState === "unverified" ? (
          <Link
            href="/settings"
            className="btn btn-secondary w-full rounded-full"
          >
            <ShieldCheck className="size-4" />
            Verify email to save
          </Link>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex items-center gap-3 rounded-[1.2rem] border border-base-300/15 bg-white/45 px-4 py-3 text-sm text-base-content/70">
            <LoaderCircle className="size-4 animate-spin" />
            Loading scores...
          </div>
        ) : scoreboard?.leaderboard.length ? (
          scoreboard.leaderboard.map((entry) => {
            const detailText = formatGameScoreDetails(gameSlug, entry.details);

            return (
              <div
                key={`${entry.rank}-${entry.username}`}
                className={`flex items-center justify-between gap-4 rounded-[1.3rem] border px-4 py-3 ${
                  entry.isViewer
                    ? "border-primary/30 bg-primary/10"
                    : "border-base-300/15 bg-base-100/75"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-base-content">
                    #{entry.rank}{" "}
                    <Link href={`/profile/${entry.userId}`}>
                      {entry.username}
                    </Link>
                  </p>
                  {detailText ? (
                    <p className="mt-1 text-sm leading-6 text-base-content/72">
                      {detailText}
                    </p>
                  ) : null}
                </div>
                <span className="display-font text-2xl font-semibold text-base-content">
                  {entry.score}
                </span>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-base-300/20 bg-white/30 px-4 py-4 text-sm leading-7 text-base-content/72">
            No verified scores have been saved for this game yet.
          </div>
        )}
      </div>
    </div>
  );
}

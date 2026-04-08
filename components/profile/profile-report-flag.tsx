"use client";

import { useRouter } from "next/navigation";
import { Flag, LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type FeatureAuthState = "disabled" | "guest" | "unverified" | "verified";
type StatusTone = "neutral" | "success" | "error";

type ProfileReportState = {
  available: boolean;
  authState: FeatureAuthState;
  viewerUserId: string | null;
  alreadyReported: boolean;
  isOwnProfile: boolean;
};

export function ProfileReportFlag({ userId }: { userId: string }) {
  const router = useRouter();
  const callbackURL = `/profile/${encodeURIComponent(userId)}`;
  const [reportState, setReportState] = useState<ProfileReportState>({
    available: true,
    authState: "disabled",
    viewerUserId: null,
    alreadyReported: false,
    isOwnProfile: false,
  });
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [submitPending, startSubmitTransition] = useTransition();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadReportState() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/profile/${encodeURIComponent(userId)}/report`,
          {
            cache: "no-store",
            signal: abortController.signal,
          },
        );
        const data = (await response.json()) as Partial<ProfileReportState> & {
          message?: string | null;
        };

        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          setReportState((current) => ({
            ...current,
            available: false,
          }));
          setStatusMessage(
            data.message ?? "This profile is no longer available.",
          );
          setStatusTone("error");
          return;
        }

        setReportState({
          available: data.available ?? true,
          authState: data.authState ?? "disabled",
          viewerUserId:
            typeof data.viewerUserId === "string" ? data.viewerUserId : null,
          alreadyReported: data.alreadyReported === true,
          isOwnProfile: data.isOwnProfile === true,
        });

        setStatusMessage(data.message ?? null);
        setStatusTone("neutral");
      } catch {
        if (!abortController.signal.aborted) {
          setReportState((current) => ({
            ...current,
            available: false,
          }));
          setStatusMessage("Profile reports are unavailable right now.");
          setStatusTone("error");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReportState();

    return () => {
      abortController.abort();
    };
  }, [userId]);

  async function handleReport() {
    if (reportState.alreadyReported) {
      return;
    }

    if (reportState.authState === "guest") {
      router.push(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
      return;
    }

    if (reportState.authState === "disabled" || !reportState.available) {
      setStatusMessage("Profile reports are unavailable right now.");
      setStatusTone("error");
      return;
    }

    if (reportState.isOwnProfile) {
      setStatusMessage("You cannot report your own profile.");
      setStatusTone("neutral");
      return;
    }

    if (!window.confirm("Report this profile for admin review?")) {
      return;
    }

    startSubmitTransition(async () => {
      try {
        const response = await fetch(
          `/api/profile/${encodeURIComponent(userId)}/report`,
          {
            method: "POST",
          },
        );
        const data = (await response.json()) as {
          alreadyReported?: boolean;
          authState?: FeatureAuthState;
          message?: string;
        };

        if (!response.ok) {
          if (data.authState) {
            setReportState((current) => ({
              ...current,
              authState: data.authState ?? current.authState,
            }));
          }

          setStatusMessage(data.message ?? "Could not report this profile.");
          setStatusTone("error");
          return;
        }

        setReportState((current) => ({
          ...current,
          alreadyReported: true,
        }));
        setStatusMessage(
          data.message ??
            (data.alreadyReported
              ? "You already reported this profile."
              : "Profile reported for admin review."),
        );
        setStatusTone("success");
      } catch {
        setStatusMessage("Could not report this profile right now.");
        setStatusTone("error");
      }
    });
  }

  const statusClassName =
    statusTone === "error"
      ? "border-error/25 bg-error/8 text-error"
      : statusTone === "success"
        ? "border-success/25 bg-success/8 text-success"
        : "border-base-300/15 bg-white/55 text-base-content/72";
  const buttonLabel = loading
    ? "Loading..."
    : reportState.alreadyReported
      ? "Reported"
      : reportState.authState === "guest"
        ? "Sign in to report"
        : submitPending
          ? "Submitting..."
          : "Report profile";

  return (
    <div className="card-surface rounded-[1.8rem] p-6">
      <div className="flex items-center gap-3">
        <Flag className="size-5 text-warning" />
        <h2 className="display-font text-2xl font-semibold">Report profile</h2>
      </div>
      <p className="mt-4 text-sm leading-7 text-base-content/78">
        Flag public names or shared account details that should be reviewed by
        an admin. Signed-in accounts can report profiles, even without a
        verified email.
      </p>

      {statusMessage ? (
        <p
          className={`mt-4 rounded-[1.2rem] border px-4 py-3 text-sm leading-7 ${statusClassName}`}
        >
          {statusMessage}
        </p>
      ) : null}

      {reportState.isOwnProfile ? null : (
        <button
          type="button"
          disabled={
            loading ||
            submitPending ||
            reportState.alreadyReported ||
            reportState.authState === "disabled" ||
            !reportState.available
          }
          onClick={handleReport}
          className="btn btn-error mt-5 rounded-full px-5"
        >
          {loading || submitPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Flag className="size-4" />
          )}
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

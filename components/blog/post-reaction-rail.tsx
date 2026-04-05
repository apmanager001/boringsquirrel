"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, LoaderCircle, ShieldCheck } from "lucide-react";

type PostReactionRailProps = {
  slug: string;
  initialLikeCount: number;
};

type FeatureAuthState = "disabled" | "guest" | "unverified" | "verified";

type LikeState = {
  available: boolean;
  authState: FeatureAuthState;
  likeCount: number;
  viewerHasLiked: boolean;
  message: string | null;
};

export function PostReactionRail({
  slug,
  initialLikeCount,
}: PostReactionRailProps) {
  const router = useRouter();
  const [likeState, setLikeState] = useState<LikeState>({
    available: true,
    authState: "disabled",
    likeCount: initialLikeCount,
    viewerHasLiked: false,
    message: null,
  });
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadLikes() {
      setLoading(true);

      try {
        const response = await fetch(`/api/blog/${slug}/like`, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const data = (await response.json()) as Partial<LikeState> & {
          message?: string | null;
        };

        if (abortController.signal.aborted) {
          return;
        }

        setLikeState({
          available: data.available ?? true,
          authState: data.authState ?? "disabled",
          likeCount: data.likeCount ?? initialLikeCount,
          viewerHasLiked: data.viewerHasLiked ?? false,
          message: data.message ?? null,
        });
      } catch {
        if (!abortController.signal.aborted) {
          setLikeState((current) => ({
            ...current,
            message: "Could not load the latest like state.",
          }));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadLikes();

    return () => {
      abortController.abort();
    };
  }, [initialLikeCount, slug]);

  function handleLikeToggle() {
    if (pending) {
      return;
    }

    if (likeState.authState === "guest") {
      router.push(`/login?callbackURL=/blog/${slug}`);
      return;
    }

    if (likeState.authState === "unverified") {
      router.push("/settings");
      return;
    }

    if (likeState.authState === "disabled") {
      setLikeState((current) => ({
        ...current,
        message:
          "Like actions are unavailable until authentication is configured.",
      }));
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/blog/${slug}/like`, {
          method: "POST",
        });
        const data = (await response.json()) as Partial<LikeState> & {
          message?: string | null;
        };

        if (!response.ok) {
          setLikeState((current) => ({
            ...current,
            authState: data.authState ?? current.authState,
            message: data.message ?? "Could not update the like.",
          }));
          return;
        }

        setLikeState({
          available: data.available ?? true,
          authState: data.authState ?? likeState.authState,
          likeCount: data.likeCount ?? likeState.likeCount,
          viewerHasLiked: data.viewerHasLiked ?? false,
          message: data.message ?? null,
        });
      } catch {
        setLikeState((current) => ({
          ...current,
          message: "Could not update the like right now.",
        }));
      }
    });
  }

  const authNote =
    likeState.authState === "guest"
      ? "Sign in with a verified account to like this post."
      : likeState.authState === "unverified"
        ? "Email verification is required before liking posts."
        : likeState.authState === "disabled"
          ? "Authentication is offline in this environment, so likes are read-only."
          : "Verified likes update the post count and popular-post sorting.";

  return (
    <div className="mt-5 space-y-4">
      <button
        type="button"
        onClick={handleLikeToggle}
        disabled={pending || loading || likeState.authState === "disabled"}
        className={`btn w-full justify-between rounded-full ${
          likeState.viewerHasLiked
            ? "btn-primary"
            : "border border-base-300/25 bg-white/40 text-base-content hover:bg-white/55"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          {pending || loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Heart
              className={`size-4 ${
                likeState.viewerHasLiked ? "fill-current" : "text-primary"
              }`}
            />
          )}
          {likeState.viewerHasLiked ? "Liked" : "Likes"}
        </span>
        <span>{likeState.likeCount}</span>
      </button>
      <div className="rounded-[1.3rem] border border-base-300/20 bg-white/35 p-4 text-sm leading-7 text-base-content/78">
        <p className="inline-flex items-center gap-2 font-semibold text-base-content/85">
          <ShieldCheck className="size-4 text-accent" />
          Verified reaction rules
        </p>
        <p className="mt-2">{authNote}</p>
        {likeState.message ? <p className="mt-2">{likeState.message}</p> : null}
      </div>
    </div>
  );
}

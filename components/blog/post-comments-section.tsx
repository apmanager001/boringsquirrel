"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, LoaderCircle, MessageSquare, SendHorizonal } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { BLOG_COMMENT_MAX_LENGTH } from "@/lib/blog-comment-schemas";

type FeatureAuthState = "disabled" | "guest" | "unverified" | "verified";

type BlogComment = {
  id: string;
  slug: string;
  userId: string;
  username: string;
  displayName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type ThreadState = {
  available: boolean;
  authState: FeatureAuthState;
  viewerUserId: string | null;
  comments: BlogComment[];
  reportedCommentIds: string[];
};

type StatusTone = "neutral" | "success" | "error";

const commentTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCommentTimestamp(input: string) {
  return commentTimestampFormatter.format(new Date(input));
}

export function PostCommentsSection({ slug }: { slug: string }) {
  const router = useRouter();
  const callbackURL = `/blog/${slug}`;
  const [thread, setThread] = useState<ThreadState>({
    available: true,
    authState: "disabled",
    viewerUserId: null,
    comments: [],
    reportedCommentIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [submitPending, startSubmitTransition] = useTransition();
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function loadComments() {
      setLoading(true);

      try {
        const response = await fetch(`/api/blog/${slug}/comments`, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const data = (await response.json()) as Partial<ThreadState> & {
          message?: string | null;
        };

        if (abortController.signal.aborted) {
          return;
        }

        setThread({
          available: data.available ?? true,
          authState: data.authState ?? "disabled",
          viewerUserId:
            typeof data.viewerUserId === "string" ? data.viewerUserId : null,
          comments: Array.isArray(data.comments) ? data.comments : [],
          reportedCommentIds: Array.isArray(data.reportedCommentIds)
            ? data.reportedCommentIds
            : [],
        });

        if (data.message) {
          setStatusMessage(data.message);
          setStatusTone("neutral");
        }
      } catch {
        if (!abortController.signal.aborted) {
          setThread((current) => ({
            ...current,
            available: false,
          }));
          setStatusMessage("Could not load comments right now.");
          setStatusTone("error");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      abortController.abort();
    };
  }, [slug]);

  function setStatus(message: string | null, tone: StatusTone) {
    setStatusMessage(message);
    setStatusTone(tone);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBody = commentBody.trim();

    if (thread.authState === "guest") {
      router.push(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
      return;
    }

    if (thread.authState === "unverified") {
      router.push("/settings");
      return;
    }

    if (thread.authState === "disabled" || !thread.available) {
      setStatus("Comments are unavailable right now.", "error");
      return;
    }

    if (!trimmedBody) {
      setStatus("Enter a comment before posting.", "error");
      return;
    }

    startSubmitTransition(async () => {
      try {
        const response = await fetch(`/api/blog/${slug}/comments`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ body: trimmedBody }),
        });
        const data = (await response.json()) as {
          comment?: BlogComment;
          message?: string;
          authState?: FeatureAuthState;
        };

        if (!response.ok || !data.comment) {
          setStatus(data.message ?? "Could not post your comment.", "error");
          if (data.authState) {
            setThread((current) => ({
              ...current,
              authState: data.authState ?? current.authState,
            }));
          }
          return;
        }

        setThread((current) => ({
          ...current,
          comments: [...current.comments, data.comment!],
        }));
        setCommentBody("");
        setStatus(data.message ?? "Comment posted.", "success");
      } catch {
        setStatus("Could not post your comment right now.", "error");
      }
    });
  }

  async function handleReport(commentId: string) {
    if (thread.reportedCommentIds.includes(commentId)) {
      return;
    }

    if (thread.authState === "guest") {
      router.push(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
      return;
    }

    if (thread.authState === "disabled" || !thread.available) {
      setStatus("Comment reports are unavailable right now.", "error");
      return;
    }

    if (!window.confirm("Report this comment for admin review?")) {
      return;
    }

    setReportingCommentId(commentId);

    try {
      const response = await fetch(
        `/api/blog/${slug}/comments/${commentId}/report`,
        {
          method: "POST",
        },
      );
      const data = (await response.json()) as {
        commentId?: string;
        alreadyReported?: boolean;
        message?: string;
      };

      if (!response.ok) {
        setStatus(data.message ?? "Could not report the comment.", "error");
        return;
      }

      setThread((current) => ({
        ...current,
        reportedCommentIds: current.reportedCommentIds.includes(commentId)
          ? current.reportedCommentIds
          : [...current.reportedCommentIds, commentId],
      }));
      setStatus(
        data.message ??
          (data.alreadyReported
            ? "You already reported this comment."
            : "Comment reported for admin review."),
        "success",
      );
    } catch {
      setStatus("Could not report the comment right now.", "error");
    } finally {
      setReportingCommentId(null);
    }
  }

  return (
    <section className="card-surface rounded-4xl p-6 sm:p-8" id="comments">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-kicker before:w-6">Discussion</p>
          <h2 className="display-font mt-3 text-3xl font-semibold">Comments</h2>
          <p className="mt-3 text-sm leading-7 text-base-content/78">
            Verified accounts can comment. Any signed-in account can report a
            comment for admin review.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300/18 bg-white/50 px-4 py-2 text-sm font-semibold text-base-content/75">
          <MessageSquare className="size-4 text-primary" />
          {loading ? "Loading..." : thread.comments.length}
        </div>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-base-300/18 bg-white/45 p-4 sm:p-5">
        {thread.available && thread.authState === "verified" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="comment-body" className="grid gap-2">
              <span className="text-sm font-semibold text-base-content/75">
                Add a comment
              </span>
              <textarea
                id="comment-body"
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                rows={4}
                maxLength={BLOG_COMMENT_MAX_LENGTH}
                className="textarea min-h-32 w-full rounded-[1.35rem] border border-base-300/20 bg-white/75"
                placeholder="Share your thoughts on the post."
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-base-content/50">
                {commentBody.trim().length}/{BLOG_COMMENT_MAX_LENGTH}
              </p>
              <button
                type="submit"
                disabled={submitPending}
                className="btn btn-primary rounded-full"
              >
                {submitPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <SendHorizonal className="size-4" />
                )}
                {submitPending ? "Posting..." : "Post comment"}
              </button>
            </div>
          </form>
        ) : thread.available && thread.authState === "guest" ? (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-base-content/78">
              Sign in with a verified account to join the conversation.
            </p>
            <Link
              href={`/login?callbackURL=${encodeURIComponent(callbackURL)}`}
              className="btn btn-primary rounded-full"
            >
              Sign in to comment
            </Link>
          </div>
        ) : thread.available && thread.authState === "unverified" ? (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-base-content/78">
              Verify your email in settings before posting comments. You can
              still report comments for review while signed in.
            </p>
            <Link href="/settings" className="btn btn-secondary rounded-full">
              Verify in settings
            </Link>
          </div>
        ) : (
          <p className="text-sm leading-7 text-base-content/78">
            Comments are unavailable in this environment right now.
          </p>
        )}
      </div>

      {statusMessage ? (
        <div
          className={`mt-4 rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
            statusTone === "success"
              ? "bg-success/15 text-success"
              : statusTone === "error"
                ? "bg-error/12 text-error"
                : "bg-base-200/15 text-base-content/80"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="rounded-[1.6rem] border border-base-300/18 bg-white/40 px-5 py-4 text-sm leading-7 text-base-content/72">
            Loading comments...
          </div>
        ) : thread.comments.length === 0 ? (
          <div className="rounded-[1.6rem] border border-base-300/18 bg-white/40 px-5 py-4 text-sm leading-7 text-base-content/72">
            No comments yet. Be the first to leave one.
          </div>
        ) : (
          thread.comments.map((comment) => {
            const alreadyReported = thread.reportedCommentIds.includes(
              comment.id,
            );
            const isOwnComment = comment.userId === thread.viewerUserId;
            const hasDistinctDisplayName =
              comment.displayName.toLowerCase() !==
              comment.username.toLowerCase();
            return (
              <article
                key={comment.id}
                id={`comment-${comment.id}`}
                className="rounded-[1.8rem] border border-base-300/18 bg-white/45 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/profile/${encodeURIComponent(comment.userId)}`}
                      className="inline-flex items-center gap-2 font-semibold text-base-content hover:text-primary"
                    >
                      {hasDistinctDisplayName ? (
                        <>
                          <span>{comment.displayName}</span>
                          <span className="text-sm font-medium text-base-content/60">
                            @{comment.username}
                          </span>
                        </>
                      ) : (
                        <span>@{comment.username}</span>
                      )}
                    </Link>
                    <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">
                      {formatCommentTimestamp(comment.createdAt)}
                    </p>
                  </div>

                  {!isOwnComment ? (
                    <button
                      type="button"
                      disabled={
                        alreadyReported || reportingCommentId === comment.id
                      }
                      onClick={() => {
                        void handleReport(comment.id);
                      }}
                      className="btn btn-ghost rounded-full border border-base-300/20 bg-white/30 px-4"
                    >
                      {reportingCommentId === comment.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Flag className="size-4" />
                      )}
                      {alreadyReported ? "Reported" : "Report"}
                    </button>
                  ) : null}
                </div>

                <p className="mt-4 whitespace-pre-wrap wrap-break-words text-sm leading-7 text-base-content/82">
                  {comment.body}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

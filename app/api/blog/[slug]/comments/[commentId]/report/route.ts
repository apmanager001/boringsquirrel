import { NextResponse } from "next/server";
import { reportBlogComment } from "@/lib/blog-comments";
import {
  getAuthSessionFromHeaders,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import { getBlogPostBySlug } from "@/lib/blog";
import { hasBetterAuthConfig } from "@/lib/env";

type RouteContext = {
  params: Promise<{ slug: string; commentId: string }>;
};

type FeatureAuthState = "disabled" | "guest" | "unverified" | "verified";

async function getFeatureAccess(requestHeaders: Headers) {
  if (!hasBetterAuthConfig()) {
    return {
      authState: "disabled" as const,
      identity: null,
    };
  }

  const session = await getAuthSessionFromHeaders(requestHeaders);
  const identity = getSessionIdentityFromUnknown(session?.user ?? null);

  if (!identity) {
    return {
      authState: "guest" as const,
      identity: null,
    };
  }

  return {
    authState: identity.emailVerified
      ? ("verified" as const)
      : ("unverified" as const),
    identity,
  };
}

function buildReportMessage(authState: FeatureAuthState) {
  if (authState === "disabled") {
    return "Comment reports are unavailable until authentication is configured.";
  }

  if (authState === "guest") {
    return "Sign in to report comments for admin review.";
  }

  return null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug, commentId } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json(
      { ok: false, message: "Post not found." },
      { status: 404 },
    );
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const message = buildReportMessage(authState);

  if (authState === "disabled") {
    return NextResponse.json(
      { ok: false, authState, message },
      { status: 503 },
    );
  }

  if (authState === "guest" || !identity) {
    return NextResponse.json(
      { ok: false, authState, message },
      { status: 401 },
    );
  }

  const result = await reportBlogComment({
    commentId,
    slug,
    reporterUserId: identity.userId,
    reporterUsername: identity.username,
    reporterDisplayName: identity.displayName,
  });

  if (!result.available) {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message: "Comment reports are unavailable right now.",
      },
      { status: 503 },
    );
  }

  if (result.status === "missing") {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message: "That comment is no longer available.",
      },
      { status: 404 },
    );
  }

  if (result.status === "own-comment") {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message: "You cannot report your own comment.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    authState,
    commentId,
    alreadyReported: result.status === "already-reported",
    message:
      result.status === "already-reported"
        ? "You already reported this comment."
        : "Comment reported for admin review.",
  });
}

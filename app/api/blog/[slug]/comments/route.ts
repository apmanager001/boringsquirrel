import { NextResponse } from "next/server";
import { createBlogComment, getBlogCommentThread } from "@/lib/blog-comments";
import { blogCommentSchema } from "@/lib/blog-comment-schemas";
import {
  getAuthSessionFromHeaders,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import { getBlogPostBySlug } from "@/lib/blog";
import { hasBetterAuthConfig } from "@/lib/env";

type RouteContext = {
  params: Promise<{ slug: string }>;
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

function buildCommentMessage(authState: FeatureAuthState) {
  if (authState === "disabled") {
    return "Comments are unavailable until authentication is configured.";
  }

  if (authState === "guest") {
    return "Sign in with a verified account to post comments.";
  }

  if (authState === "unverified") {
    return "Verify your email before posting comments.";
  }

  return null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json(
      { ok: false, message: "Post not found." },
      { status: 404 },
    );
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const thread = await getBlogCommentThread(slug, identity?.userId);

  return NextResponse.json({
    ok: true,
    available: thread.available,
    authState,
    viewerUserId: identity?.userId ?? null,
    comments: thread.comments,
    reportedCommentIds: thread.reportedCommentIds,
    message: buildCommentMessage(authState),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json(
      { ok: false, message: "Post not found." },
      { status: 404 },
    );
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const message = buildCommentMessage(authState);

  if (authState === "disabled") {
    return NextResponse.json(
      { ok: false, authState, message },
      { status: 503 },
    );
  }

  if (authState === "guest") {
    return NextResponse.json(
      { ok: false, authState, message },
      { status: 401 },
    );
  }

  if (authState === "unverified" || !identity) {
    return NextResponse.json(
      { ok: false, authState, message },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = blogCommentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message:
          parsed.error.issues[0]?.message ??
          "Enter a valid comment before posting.",
      },
      { status: 400 },
    );
  }

  const result = await createBlogComment({
    slug,
    body: parsed.data.body,
    userId: identity.userId,
    username: identity.username,
    displayName: identity.displayName,
  });

  if (!result.available || !result.comment) {
    return NextResponse.json(
      { ok: false, authState, message: "Comments are unavailable right now." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    authState,
    comment: result.comment,
    message: "Comment posted.",
  });
}

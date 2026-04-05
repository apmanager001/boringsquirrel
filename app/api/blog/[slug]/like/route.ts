import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  getAuthSessionFromHeaders,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import { getBlogPostBySlug } from "@/lib/blog";
import { getBlogLikeSnapshot, toggleBlogLike } from "@/lib/blog-likes";
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

function buildMessage(authState: FeatureAuthState) {
  if (authState === "disabled") {
    return "Like actions are unavailable until authentication is configured.";
  }

  if (authState === "guest") {
    return "Sign in with a verified account to like posts.";
  }

  if (authState === "unverified") {
    return "Verify your email before liking blog posts.";
  }

  return null;
}

function revalidateBlogSurfaces(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/popular");
  revalidatePath("/blog/recent");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog/category/[slug]", "page");
}

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ ok: false, message: "Post not found." }, { status: 404 });
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const snapshot = await getBlogLikeSnapshot(slug, identity?.userId);

  return NextResponse.json({
    ok: true,
    available: snapshot.available,
    authState,
    likeCount: snapshot.likeCount,
    viewerHasLiked: snapshot.viewerHasLiked,
    message: buildMessage(authState),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ ok: false, message: "Post not found." }, { status: 404 });
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const message = buildMessage(authState);

  if (authState === "disabled") {
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }

  if (authState === "guest") {
    return NextResponse.json({ ok: false, message }, { status: 401 });
  }

  if (authState === "unverified" || !identity) {
    return NextResponse.json({ ok: false, message }, { status: 403 });
  }

  const result = await toggleBlogLike({
    slug,
    userId: identity.userId,
    username: identity.username,
    displayName: identity.displayName,
  });

  if (!result.available) {
    return NextResponse.json(
      { ok: false, message: "Blog likes are unavailable right now." },
      { status: 503 },
    );
  }

  revalidateBlogSurfaces(slug);

  return NextResponse.json({
    ok: true,
    available: true,
    authState,
    likeCount: result.likeCount,
    viewerHasLiked: result.liked,
    liked: result.liked,
    message: result.liked ? "Post liked." : "Like removed.",
  });
}
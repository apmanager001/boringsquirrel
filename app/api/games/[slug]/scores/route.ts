import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAuthSessionFromHeaders,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import {
  getGameLeaderboard,
  isSupportedScoreGame,
  saveGameScore,
} from "@/lib/game-scores";
import { hasBetterAuthConfig } from "@/lib/env";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type FeatureAuthState = "disabled" | "guest" | "unverified" | "verified";

const scoreSubmissionSchema = z.object({
  score: z.number().int().min(0).max(999999),
  details: z
    .record(
      z.string(),
      z.union([z.string().max(120), z.number().finite(), z.boolean(), z.null()]),
    )
    .default({}),
});

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
    return "Score saving is unavailable until authentication is configured.";
  }

  if (authState === "guest") {
    return "Sign in with a verified account to save scores.";
  }

  if (authState === "unverified") {
    return "Verify your email before saving leaderboard scores.";
  }

  return null;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;

  if (!isSupportedScoreGame(slug)) {
    return NextResponse.json({ ok: false, message: "Game not found." }, { status: 404 });
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 8;
  const scoreboard = await getGameLeaderboard(slug, limit, identity?.userId);

  return NextResponse.json({
    ok: true,
    available: scoreboard.available,
    authState,
    leaderboard: scoreboard.leaderboard,
    viewerBest: scoreboard.viewerBest,
    message: buildMessage(authState),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;

  if (!isSupportedScoreGame(slug)) {
    return NextResponse.json({ ok: false, message: "Game not found." }, { status: 404 });
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

  const rawBody = await request.json().catch(() => null);
  const parsedBody = scoreSubmissionSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, message: parsedBody.error.issues[0]?.message ?? "Invalid score payload." },
      { status: 400 },
    );
  }

  const saveResult = await saveGameScore({
    gameSlug: slug,
    userId: identity.userId,
    username: identity.username,
    displayName: identity.displayName,
    score: parsedBody.data.score,
    details: parsedBody.data.details,
  });

  if (!saveResult.available) {
    return NextResponse.json(
      { ok: false, message: "Score saving is unavailable right now." },
      { status: 503 },
    );
  }

  const scoreboard = await getGameLeaderboard(slug, 8, identity.userId);
  const resultMessage = saveResult.saved
    ? saveResult.entry
      ? `Score saved at ${saveResult.entry.score}.`
      : "Score saved."
    : "Your saved best is already higher than this run.";

  return NextResponse.json({
    ok: true,
    available: true,
    authState,
    saved: saveResult.saved,
    improved: saveResult.improved,
    leaderboard: scoreboard.leaderboard,
    viewerBest: scoreboard.viewerBest,
    message: resultMessage,
  });
}
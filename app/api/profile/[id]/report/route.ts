import { NextResponse } from "next/server";
import {
  getAuthSessionFromHeaders,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import { getStoredAuthUserById } from "@/lib/auth-users";
import { hasBetterAuthConfig } from "@/lib/env";
import {
  getProfileReportState,
  reportUserProfile,
} from "@/lib/profile-reports";

type RouteContext = {
  params: Promise<{ id: string }>;
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

function buildReportMessage(
  authState: FeatureAuthState,
  isOwnProfile: boolean,
) {
  if (authState === "disabled") {
    return "Profile reports are unavailable until authentication is configured.";
  }

  if (authState === "guest") {
    return "Sign in to report profiles for admin review.";
  }

  if (isOwnProfile) {
    return "You cannot report your own profile.";
  }

  return null;
}

async function getReportedUserOrNull(userId: string) {
  const reportedUser = await getStoredAuthUserById(userId);

  if (!reportedUser || reportedUser.banned === true) {
    return null;
  }

  return reportedUser;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const reportedUser = await getReportedUserOrNull(id);

  if (!reportedUser) {
    return NextResponse.json(
      { ok: false, message: "Profile not found." },
      { status: 404 },
    );
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const reportState = await getProfileReportState({
    reportedUserId: id,
    viewerUserId: identity?.userId,
  });

  return NextResponse.json({
    ok: true,
    available: reportState.available,
    authState,
    viewerUserId: identity?.userId ?? null,
    alreadyReported: reportState.alreadyReported,
    isOwnProfile: reportState.isOwnProfile,
    message: buildReportMessage(authState, reportState.isOwnProfile),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const reportedUser = await getReportedUserOrNull(id);

  if (!reportedUser) {
    return NextResponse.json(
      { ok: false, message: "Profile not found." },
      { status: 404 },
    );
  }

  const { authState, identity } = await getFeatureAccess(request.headers);
  const message = buildReportMessage(authState, identity?.userId === id);

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

  const result = await reportUserProfile({
    reportedUserId: id,
    reporterUserId: identity.userId,
    reporterUsername: identity.username,
    reporterDisplayName: identity.displayName,
  });

  if (!result.available) {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message: "Profile reports are unavailable right now.",
      },
      { status: 503 },
    );
  }

  if (result.status === "missing" || result.status === "already-banned") {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message: "That profile is no longer available.",
      },
      { status: 404 },
    );
  }

  if (result.status === "own-profile") {
    return NextResponse.json(
      {
        ok: false,
        authState,
        message: "You cannot report your own profile.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    authState,
    alreadyReported: result.status === "already-reported",
    message:
      result.status === "already-reported"
        ? "You already reported this profile."
        : "Profile reported for admin review.",
  });
}

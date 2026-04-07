"use client";

import Link from "next/link";
import { CircleUserRound, UserRoundPlus } from "lucide-react";
import { useStableAuthSession } from "./use-stable-auth-session";

type SessionCtaProps = {
  authEnabled: boolean;
};

function AuthenticatedSessionCta() {
  const { session, isPending } = useStableAuthSession();
  const username =
    session?.user && "displayUsername" in session.user
      ? String(session.user.displayUsername || session.user.name || "Account")
      : session?.user?.name || "Account";

  if (isPending || !session?.user) {
    return (
      <>
        <Link
          href="/register"
          className="btn btn-ghost hidden rounded-full border border-base-300/25 bg-white/35 xl:inline-flex"
        >
          <UserRoundPlus className="size-4" />
          Register
        </Link>
        <Link href="/login" className="btn btn-primary rounded-full">
          <CircleUserRound className="size-4" />
          Login
        </Link>
      </>
    );
  }

  return (
    <Link href="/settings" className="btn btn-primary rounded-full">
      <CircleUserRound className="size-4" />
      {username}
    </Link>
  );
}

export function SessionCta({ authEnabled }: SessionCtaProps) {
  if (!authEnabled) {
    return (
      <>
        <Link
          href="/register"
          className="btn btn-ghost hidden rounded-full border border-base-300/25 bg-white/35 sm:inline-flex"
        >
          <UserRoundPlus className="size-4" />
          Register
        </Link>
        <Link href="/login" className="btn btn-primary rounded-full">
          <CircleUserRound className="size-4" />
          Login
        </Link>
      </>
    );
  }

  return <AuthenticatedSessionCta />;
}

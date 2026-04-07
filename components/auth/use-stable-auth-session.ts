"use client";

import { useSyncExternalStore } from "react";
import { authClient, type AuthSession } from "@/lib/auth-client";

type StableAuthSession = {
  session: AuthSession | null;
  isPending: boolean;
};

function subscribe() {
  return () => {};
}

export function useStableAuthSession(): StableAuthSession {
  const { data: session, isPending } = authClient.useSession();
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isHydrated) {
    return {
      session: null,
      isPending: true,
    };
  }

  return {
    session: session ?? null,
    isPending,
  };
}

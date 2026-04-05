"use client";

import { useTransition } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

type GoogleSignInButtonProps = {
  enabled: boolean;
  callbackURL: string;
  label: string;
  variant?: "outline" | "solid";
};

export function GoogleSignInButton({
  enabled,
  callbackURL,
  label,
  variant = "outline",
}: GoogleSignInButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!enabled || pending) {
      return;
    }

    startTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL: "/login",
      });
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!enabled || pending}
      className={`btn w-full rounded-full ${
        variant === "solid"
          ? "btn-secondary"
          : "border border-base-300/20 bg-white/45 text-base-content hover:bg-white/60"
      }`}
    >
      <Image
        src="/socialIcons/google.svg"
        alt="Google icon"
        width={16}
        height={16}
      />
      {pending ? "Opening Google..." : label}
    </button>
  );
}

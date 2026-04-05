"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, MailX } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type VerifyEmailViewProps = {
  authEnabled: boolean;
  token: string | undefined;
  callbackURL: string | undefined;
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "The verification link could not be completed.";
}

export function VerifyEmailView({
  authEnabled,
  token,
  callbackURL,
}: VerifyEmailViewProps) {
  const router = useRouter();
  const [result, setResult] = useState<{
    state: "pending" | "success" | "error";
    message: string;
  }>({
    state: "pending",
    message: "Verifying your email now...",
  });

  const fallbackState = !authEnabled
    ? {
        state: "error" as const,
        message: "Authentication is not configured in this environment.",
      }
    : !token
      ? {
          state: "error" as const,
          message: "This verification link is missing its token.",
        }
      : null;
  const state = fallbackState?.state ?? result.state;
  const message = fallbackState?.message ?? result.message;

  useEffect(() => {
    if (!authEnabled || !token) {
      return;
    }

    const verifiedToken = token;
    let cancelled = false;

    async function verify() {
      const result = await authClient.verifyEmail({
        query: {
          token: verifiedToken,
          ...(callbackURL ? { callbackURL } : {}),
        },
      });

      if (cancelled) {
        return;
      }

      if (result.error) {
        setResult({
          state: "error",
          message: getErrorMessage(result.error),
        });
        return;
      }

      setResult({
        state: "success",
        message: "Email verified. Redirecting you into the app...",
      });
      router.replace(callbackURL || "/settings");
      router.refresh();
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [authEnabled, callbackURL, router, token]);

  return (
    <div className="card-surface rounded-4xl p-8 text-center sm:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        {state === "pending" ? (
          <LoaderCircle className="size-8 animate-spin text-primary" />
        ) : state === "success" ? (
          <CheckCircle2 className="size-8 text-success" />
        ) : (
          <MailX className="size-8 text-error" />
        )}

        <div className="space-y-3">
          <p className="section-kicker before:hidden">Email verification</p>
          <h1 className="display-font text-4xl font-semibold text-base-content sm:text-5xl">
            {state === "error"
              ? "That link did not work"
              : "Checking your verification link"}
          </h1>
          <p className="text-base leading-8 text-base-content/80">{message}</p>
        </div>

        {state === "error" ? (
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <Link href="/login" className="btn btn-primary rounded-full">
              Back to login
            </Link>
            <Link
              href="/register"
              className="btn btn-ghost rounded-full border border-base-300/20 bg-white/35"
            >
              Create account again
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

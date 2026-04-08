"use client";

import Link from "next/link";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/auth-schemas";

type ForgotPasswordFormProps = {
  authEnabled: boolean;
  mailEnabled: boolean;
  defaultEmail?: string;
  callbackURL?: string;
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Could not start the password reset flow right now.";
}

export function ForgotPasswordForm({
  authEnabled,
  mailEnabled,
  defaultEmail = "",
  callbackURL = "/settings",
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const loginHref =
    callbackURL === "/settings"
      ? "/login"
      : `/login?callbackURL=${encodeURIComponent(callbackURL)}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldError(null);
    setMessage(null);
    setSuccess(false);

    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message ?? "Enter a valid email address.",
      );
      return;
    }

    if (!authEnabled) {
      setMessage(
        "Authentication is not configured yet. Add your auth env values first.",
      );
      return;
    }

    if (!mailEnabled) {
      setMessage(
        "Password reset email delivery is not configured right now. Contact support if you still need help signing in.",
      );
      return;
    }

    startTransition(async () => {
      const normalizedEmail = parsed.data.email.toLowerCase();
      const redirectTo = new URL("/reset-password", window.location.origin);

      if (callbackURL) {
        redirectTo.searchParams.set("callbackURL", callbackURL);
      }

      const result = await authClient.requestPasswordReset({
        email: normalizedEmail,
        redirectTo: redirectTo.toString(),
      });

      if (result.error) {
        setSuccess(false);
        setMessage(getErrorMessage(result.error));
        return;
      }

      setSuccess(true);
      setMessage(
        result.data?.message ??
          "If this email exists in our system, check your inbox for the reset link.",
      );
    });
  }

  return (
    <div className="card-surface rounded-4xl p-6 sm:p-8">
      <div className="space-y-2">
        <p className="section-kicker before:w-6">Reset password</p>
        <h2 className="display-font text-3xl font-semibold">
          Reset your password
        </h2>
        <p className="text-sm leading-7 text-base-content/75">
          Enter the email on your account and we&apos;ll send you a reset link.
        </p>
      </div>

      {!authEnabled || !mailEnabled ? (
        <div className="mt-5 rounded-[1.4rem] bg-warning/80 px-4 py-3 text-sm leading-7 text-warning-content">
          {!authEnabled
            ? "Authentication is not configured in this environment yet."
            : "Password reset email delivery is not configured right now."}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label htmlFor="email" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Account email
          </span>
          <input
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {fieldError ? (
            <span className="text-sm text-error">{fieldError}</span>
          ) : null}
        </label>

        {message ? (
          <div
            className={`rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
              success
                ? "bg-success/15 text-success"
                : "bg-base-200/15 text-base-content/80"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={pending || !authEnabled || !mailEnabled}
            className="btn btn-primary rounded-full"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <MailCheck className="size-4" />
            )}
            {pending ? "Sending reset link..." : "Send reset link"}
          </button>
          <Link
            href={loginHref}
            className="btn btn-ghost rounded-full border border-base-300/20 bg-white/35"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

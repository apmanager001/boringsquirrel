"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, MailX } from "lucide-react";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/auth-schemas";

type ResetPasswordFormProps = {
  authEnabled: boolean;
  token?: string;
  error?: string;
  callbackURL?: string;
};

type ResetPasswordField = "password" | "confirmPassword";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    if (message.toLowerCase().includes("invalid token")) {
      return "This reset link is invalid or has expired. Request a fresh link and try again.";
    }

    return message;
  }

  return "Could not reset your password right now.";
}

function getFallbackMessage(error?: string, token?: string) {
  if (error === "INVALID_TOKEN") {
    return "This reset link is invalid or has expired. Request a fresh link and try again.";
  }

  if (!token) {
    return "This password reset link is missing its token.";
  }

  return "Password reset is not configured in this environment.";
}

export function ResetPasswordForm({
  authEnabled,
  token,
  error,
  callbackURL = "/settings",
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ResetPasswordField, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const loginHref =
    callbackURL === "/settings"
      ? "/login"
      : `/login?callbackURL=${encodeURIComponent(callbackURL)}`;
  const forgotPasswordHref =
    callbackURL === "/settings"
      ? "/forgot-password"
      : `/forgot-password?callbackURL=${encodeURIComponent(callbackURL)}`;
  const fallbackMessage =
    !authEnabled || error || !token ? getFallbackMessage(error, token) : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authEnabled || !token) {
      return;
    }

    setMessage(null);

    const parsed = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<ResetPasswordField, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "password" || field === "confirmPassword") {
          nextErrors[field] = issue.message;
        }
      }

      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      });

      if (result.error) {
        setMessage(getErrorMessage(result.error));
        return;
      }

      setMessage("Password updated. Redirecting you to login...");
      router.replace(loginHref);
      router.refresh();
    });
  }

  if (fallbackMessage) {
    return (
      <div className="card-surface rounded-4xl p-8 text-center sm:p-10">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <MailX className="size-8 text-error" />
          <div className="space-y-3">
            <p className="section-kicker before:hidden">Password reset</p>
            <h1 className="display-font text-4xl font-semibold text-base-content sm:text-5xl">
              That reset link did not work
            </h1>
            <p className="text-base leading-8 text-base-content/80">
              {fallbackMessage}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <Link
              href={forgotPasswordHref}
              className="btn btn-primary rounded-full"
            >
              Request another link
            </Link>
            <Link
              href={loginHref}
              className="btn btn-ghost rounded-full border border-base-300/20 bg-white/35"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-4xl p-6 sm:p-8">
      <div className="space-y-2">
        <p className="section-kicker before:w-6">Choose a new password</p>
        <h2 className="display-font text-3xl font-semibold">
          Set your new password
        </h2>
        <p className="text-sm leading-7 text-base-content/75">
          Use at least 8 characters, including letters, numbers, and a special
          character.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label htmlFor="password" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            New password
          </span>
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="Choose a strong password"
            autoComplete="new-password"
          />
          {fieldErrors.password ? (
            <span className="text-sm text-error">{fieldErrors.password}</span>
          ) : null}
        </label>

        <label htmlFor="confirmPassword" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Confirm password
          </span>
          <input
            id="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword ? (
            <span className="text-sm text-error">
              {fieldErrors.confirmPassword}
            </span>
          ) : null}
        </label>

        {message ? (
          <div className="rounded-[1.4rem] bg-base-200/15 px-4 py-3 text-sm leading-7 text-base-content/80">
            {message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary rounded-full"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {pending ? "Updating password..." : "Save new password"}
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

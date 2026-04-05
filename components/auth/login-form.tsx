"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, LoaderCircle, MailWarning } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/auth-schemas";

type LoginFormProps = {
  authEnabled: boolean;
  googleEnabled: boolean;
  mailEnabled: boolean;
  callbackURL?: string;
};

type LoginField = "identifier" | "password";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    if (message.toLowerCase().includes("email not verified")) {
      return "Your email is not verified yet. Check your inbox or resend the verification email.";
    }

    return message;
  }

  return "Something went wrong while signing in.";
}

export function LoginForm({
  authEnabled,
  googleEnabled,
  mailEnabled,
  callbackURL = "/settings",
}: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<LoginField, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resending, startResendTransition] = useTransition();
  const [pending, startTransition] = useTransition();
  const registerHref =
    callbackURL === "/settings"
      ? "/register"
      : `/register?callbackURL=${encodeURIComponent(callbackURL)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setCanResend(false);

    const parsed = loginSchema.safeParse({
      identifier,
      password,
      rememberMe,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<LoginField, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "identifier" || field === "password") {
          nextErrors[field] = issue.message;
        }
      }

      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    if (!authEnabled) {
      setMessage(
        "Authentication is not configured yet. Add your auth env values first.",
      );
      return;
    }

    startTransition(async () => {
      const normalizedIdentifier = parsed.data.identifier.trim();
      const result = normalizedIdentifier.includes("@")
        ? await authClient.signIn.email({
            email: normalizedIdentifier.toLowerCase(),
            password: parsed.data.password,
            rememberMe,
            callbackURL,
          })
        : await authClient.signIn.username({
            username: normalizedIdentifier,
            password: parsed.data.password,
            rememberMe,
            callbackURL,
          });

      if (result.error) {
        const nextMessage = getErrorMessage(result.error);
        setMessage(nextMessage);
        setCanResend(
          normalizedIdentifier.includes("@") &&
            mailEnabled &&
            nextMessage.toLowerCase().includes("not verified"),
        );
        return;
      }

      router.push(callbackURL);
      router.refresh();
    });
  }

  function handleResendVerification() {
    if (!identifier.includes("@") || !authEnabled || !mailEnabled) {
      return;
    }

    startResendTransition(async () => {
      const result = await authClient.sendVerificationEmail({
        email: identifier.toLowerCase(),
        callbackURL,
      });

      if (result.error) {
        setMessage(getErrorMessage(result.error));
        return;
      }

      setMessage(
        `A fresh verification email was sent to ${identifier.toLowerCase()}.`,
      );
    });
  }

  return (
    <div className="card-surface rounded-4xl p-6 sm:p-8">
      <div className="space-y-2">
        <p className="section-kicker before:w-6">Sign in</p>
        <h2 className="display-font text-3xl font-semibold">
          Return to your account
        </h2>
        <p className="text-sm leading-7 text-base-content/75">
          Use your email or username. Verified accounts unlock likes and saved
          scores.
        </p>
      </div>

      {!authEnabled ? (
        <div className="mt-5 rounded-[1.4rem] bg-warning/15 px-4 py-3 text-sm leading-7 text-warning-content">
          Authentication is not configured in the current environment yet.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label htmlFor="username" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Email or username
          </span>
          <input
            id="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="you@example.com or squirrelsam"
            autoComplete="username"
          />
          {fieldErrors.identifier ? (
            <span className="text-sm text-error">{fieldErrors.identifier}</span>
          ) : null}
        </label>

        <label htmlFor="password" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Password
          </span>
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="Your password"
            autoComplete="current-password"
          />
          {fieldErrors.password ? (
            <span className="text-sm text-error">{fieldErrors.password}</span>
          ) : null}
        </label>

        <label className="inline-flex items-center gap-3 text-sm text-base-content/75">
          <input
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            type="checkbox"
            className="checkbox checkbox-sm border-base-300/30"
          />
          Keep me signed in on this device.
        </label>

        {message ? (
          <div className="rounded-[1.4rem] bg-base-200/15 px-4 py-3 text-sm leading-7 text-base-content/80">
            {message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={pending || !authEnabled}
            className="btn btn-primary rounded-full"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {pending ? "Signing in..." : "Sign in"}
          </button>
          <GoogleSignInButton
            enabled={authEnabled && googleEnabled}
            callbackURL={callbackURL}
            label={
              googleEnabled
                ? "Continue with Google"
                : "Google sign-in needs env setup"
            }
          />
        </div>
      </form>

      {canResend ? (
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={resending}
          className="btn btn-ghost mt-4 rounded-full border border-base-300/20 bg-white/35"
        >
          <MailWarning className="size-4" />
          {resending ? "Sending email..." : "Resend verification email"}
        </button>
      ) : null}

      <p className="mt-5 text-sm leading-7 text-base-content/72">
        Need an account?{" "}
        <Link href={registerHref} className="font-semibold text-primary">
          Create one here
        </Link>
        .
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { CheckCircle2, LoaderCircle, UserRoundPlus } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { authClient } from "@/lib/auth-client";
import { registerSchema, usernameSchema } from "@/lib/auth-schemas";

type RegisterFormProps = {
  authEnabled: boolean;
  googleEnabled: boolean;
  mailEnabled: boolean;
  callbackURL?: string;
};

type RegisterField = "username" | "displayName" | "email" | "password";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Something went wrong while creating the account.";
}

export function RegisterForm({
  authEnabled,
  googleEnabled,
  mailEnabled,
  callbackURL = "/settings",
}: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<RegisterField, string>>
  >({});
  const [usernameLookup, setUsernameLookup] = useState<{
    username: string;
    status: UsernameStatus;
    message: string;
  }>({
    username: "",
    status: "idle",
    message: "",
  });
  const [success, setSuccess] = useState(false);
  const deferredUsername = useDeferredValue(username.trim());
  const [pending, startTransition] = useTransition();
  const loginHref =
    callbackURL === "/settings"
      ? "/login"
      : `/login?callbackURL=${encodeURIComponent(callbackURL)}`;

  const usernameFeedback = useMemo(() => {
    if (!authEnabled || !deferredUsername) {
      return {
        status: "idle" as UsernameStatus,
        message: "",
      };
    }

    const parsed = usernameSchema.safeParse(deferredUsername);

    if (!parsed.success) {
      return {
        status: "invalid" as UsernameStatus,
        message: parsed.error.issues[0]?.message ?? "Enter a valid username.",
      };
    }

    if (usernameLookup.username !== deferredUsername) {
      return {
        status: "checking" as UsernameStatus,
        message: "Checking username availability...",
      };
    }

    return {
      status: usernameLookup.status,
      message: usernameLookup.message,
    };
  }, [authEnabled, deferredUsername, usernameLookup]);

  useEffect(() => {
    if (!authEnabled || !deferredUsername) {
      return;
    }

    const parsed = usernameSchema.safeParse(deferredUsername);

    if (!parsed.success) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setUsernameLookup({
        username: deferredUsername,
        status: "checking",
        message: "Checking username availability...",
      });

      const result = await authClient.isUsernameAvailable({
        username: deferredUsername,
      });

      if (cancelled) {
        return;
      }

      if (result.error) {
        setUsernameLookup({
          username: deferredUsername,
          status: "invalid",
          message: getErrorMessage(result.error),
        });
        return;
      }

      if (result.data?.available) {
        setUsernameLookup({
          username: deferredUsername,
          status: "available",
          message: "That username is available.",
        });
        return;
      }

      setUsernameLookup({
        username: deferredUsername,
        status: "taken",
        message: "That username is already taken.",
      });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [authEnabled, deferredUsername]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setSuccess(false);

    const parsed = registerSchema.safeParse({
      username,
      displayName,
      email,
      password,
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<RegisterField, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          field === "username" ||
          field === "displayName" ||
          field === "email" ||
          field === "password"
        ) {
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

    if (!mailEnabled) {
      setMessage(
        "SMTP is not configured yet, so email verification cannot be delivered right now.",
      );
      return;
    }

    startTransition(async () => {
      const normalizedDisplayName =
        parsed.data.displayName?.trim() || parsed.data.username;
      const result = await authClient.signUp.email({
        username: parsed.data.username,
        displayUsername: normalizedDisplayName,
        name: normalizedDisplayName,
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
        callbackURL,
      });

      if (result.error) {
        setSuccess(false);
        setMessage(getErrorMessage(result.error));
        return;
      }

      setSuccess(true);
      setPassword("");
      setMessage(
        `Account created for ${parsed.data.email.toLowerCase()}. Check your inbox to verify your email.`,
      );
    });
  }

  return (
    <div className="card-surface rounded-4xl p-6 sm:p-8">
      <div className="space-y-2">
        <p className="section-kicker before:w-6">Register</p>
        <h2 className="display-font text-3xl font-semibold">
          Create your player account
        </h2>
        <p className="text-sm leading-7 text-base-content/75">
          Usernames are unique, email verification is required, and all new
          accounts start as non-admin.
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
            Username
          </span>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="squirrelsam"
            autoComplete="username"
          />
          {fieldErrors.username ? (
            <span className="text-sm text-error">{fieldErrors.username}</span>
          ) : null}
          {usernameFeedback.message ? (
            <span
              className={`text-sm ${
                usernameFeedback.status === "available"
                  ? "text-success"
                  : usernameFeedback.status === "taken" ||
                      usernameFeedback.status === "invalid"
                    ? "text-error"
                    : "text-base-content/65"
              }`}
            >
              {usernameFeedback.message}
            </span>
          ) : null}
        </label>

        <label htmlFor="displayName" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Display name
          </span>
          <input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="Optional. Defaults to your username."
            autoComplete="off"
          />
          {fieldErrors.displayName ? (
            <span className="text-sm text-error">
              {fieldErrors.displayName}
            </span>
          ) : null}
        </label>

        <label htmlFor="email" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Email
          </span>
          <input
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {fieldErrors.email ? (
            <span className="text-sm text-error">{fieldErrors.email}</span>
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
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          {fieldErrors.password ? (
            <span className="text-sm text-error">{fieldErrors.password}</span>
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
            ) : success ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <UserRoundPlus className="size-4" />
            )}
            {pending
              ? "Creating account..."
              : success
                ? "Account created"
                : "Create account"}
          </button>
          <GoogleSignInButton
            enabled={authEnabled && googleEnabled}
            callbackURL={callbackURL}
            label={
              googleEnabled
                ? "Start with Google"
                : "Google sign-in needs env setup"
            }
          />
        </div>
      </form>

      <p className="mt-5 text-sm leading-7 text-base-content/72">
        Already signed up?{" "}
        <Link href={loginHref} className="font-semibold text-primary">
          Go to login
        </Link>
        .
      </p>
    </div>
  );
}

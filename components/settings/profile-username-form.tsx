"use client";

import {
  useActionState,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LoaderCircle, Save } from "lucide-react";
import {
  saveProfileUsername,
  type ProfileUsernameFormState,
} from "@/app/settings/actions";
import { authClient } from "@/lib/auth-client";
import { normalizeUsername, usernameSchema } from "@/lib/auth-schemas";

type ProfileUsernameFormProps = {
  username: string;
  displayName: string;
};

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "current";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Could not check username availability right now.";
}

export function ProfileUsernameForm({
  username: initialUsername,
  displayName: initialDisplayName,
}: ProfileUsernameFormProps) {
  const initialState: ProfileUsernameFormState = {
    status: "idle",
    message: "",
    username: initialUsername,
    displayName: initialDisplayName,
  };
  const [state, formAction, pending] = useActionState(
    saveProfileUsername,
    initialState,
  );
  const [username, setUsername] = useState(initialUsername);
  const [currentUsername, setCurrentUsername] = useState(initialUsername);
  const [currentDisplayName, setCurrentDisplayName] =
    useState(initialDisplayName);
  const [usernameLookup, setUsernameLookup] = useState<{
    username: string;
    status: UsernameStatus;
    message: string;
  }>({
    username: normalizeUsername(initialUsername),
    status: "idle",
    message: "",
  });
  const deferredUsername = useDeferredValue(username.trim());
  const normalizedCurrentUsername = normalizeUsername(currentUsername);
  const normalizedDeferredUsername = deferredUsername
    ? normalizeUsername(deferredUsername)
    : "";
  const isUnchanged =
    normalizedDeferredUsername.length > 0 &&
    normalizedDeferredUsername === normalizedCurrentUsername;

  useEffect(() => {
    setUsername(initialUsername);
    setCurrentUsername(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    setCurrentDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    if (state.username) {
      setUsername(state.username);
      setCurrentUsername(state.username);
      setUsernameLookup({
        username: normalizeUsername(state.username),
        status: "current",
        message: "This is your current username.",
      });
    }

    if (state.displayName) {
      setCurrentDisplayName(state.displayName);
    }
  }, [state.displayName, state.status, state.username]);

  const usernameFeedback = useMemo(() => {
    if (!deferredUsername) {
      return {
        status: "idle" as UsernameStatus,
        message: "",
      };
    }

    if (normalizedDeferredUsername === normalizedCurrentUsername) {
      return {
        status: "current" as UsernameStatus,
        message: "This is your current username.",
      };
    }

    const parsed = usernameSchema.safeParse(deferredUsername);

    if (!parsed.success) {
      return {
        status: "invalid" as UsernameStatus,
        message: parsed.error.issues[0]?.message ?? "Enter a valid username.",
      };
    }

    if (usernameLookup.username !== normalizedDeferredUsername) {
      return {
        status: "checking" as UsernameStatus,
        message: "Checking username availability...",
      };
    }

    return {
      status: usernameLookup.status,
      message: usernameLookup.message,
    };
  }, [
    deferredUsername,
    normalizedCurrentUsername,
    normalizedDeferredUsername,
    usernameLookup,
  ]);

  useEffect(() => {
    if (!deferredUsername) {
      return;
    }

    if (normalizedDeferredUsername === normalizedCurrentUsername) {
      return;
    }

    const parsed = usernameSchema.safeParse(deferredUsername);

    if (!parsed.success) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setUsernameLookup({
        username: normalizedDeferredUsername,
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
          username: normalizedDeferredUsername,
          status: "invalid",
          message: getErrorMessage(result.error),
        });
        return;
      }

      setUsernameLookup({
        username: normalizedDeferredUsername,
        status: result.data?.available ? "available" : "taken",
        message: result.data?.available
          ? "That username is available."
          : "That username is already taken.",
      });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deferredUsername, normalizedCurrentUsername, normalizedDeferredUsername]);

  const disableSubmit =
    pending ||
    !deferredUsername ||
    isUnchanged ||
    usernameFeedback.status === "checking" ||
    usernameFeedback.status === "invalid" ||
    usernameFeedback.status === "taken";

  return (
    <div className="mt-4 rounded-[1.4rem] border border-base-300/18 bg-base-100/55 p-4">
      <p className="text-sm leading-7 text-base-content/80">
        Current display name: {currentDisplayName}.
      </p>
      <p className="mt-1 text-sm leading-7 text-base-content/70">
        Usernames stay unique, and saved leaderboard entries update when you
        rename.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <label htmlFor="settings-username" className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Username
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              id="settings-username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
              placeholder="squirrelsam"
              autoComplete="username"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={disableSubmit}
              className="btn btn-primary rounded-full px-6"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {pending ? "Saving..." : "Save username"}
            </button>
          </div>
          {state.errors?.username ? (
            <span className="text-sm text-error">{state.errors.username}</span>
          ) : null}
          {!state.errors?.username && usernameFeedback.message ? (
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

        {state.message ? (
          <div
            className={`rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
              state.status === "success"
                ? "bg-success/15 text-success"
                : "bg-error/15 text-error"
            }`}
          >
            {state.message}
          </div>
        ) : null}
      </form>
    </div>
  );
}

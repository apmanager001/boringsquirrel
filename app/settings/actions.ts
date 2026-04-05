"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { syncStoredBlogLikeIdentity } from "@/lib/blog-likes";
import { syncStoredGameScoreIdentity } from "@/lib/game-scores";
import {
  auth,
  getAuthSession,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import { normalizeUsername, usernameSchema } from "@/lib/auth-schemas";
import {
  type PublicProfileSocialLinks,
  updateUserProfileSocialLinks,
} from "@/lib/profiles";

type ProfileSocialLinksField = keyof PublicProfileSocialLinks;
type ProfileUsernameField = "username";

export type ProfileUsernameFormState = {
  status: "idle" | "success" | "error";
  message: string;
  username?: string;
  displayName?: string;
  errors?: Partial<Record<ProfileUsernameField, string>>;
};

export type ProfileSocialLinksFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<ProfileSocialLinksField, string>>;
};

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    if (
      "body" in error &&
      error.body &&
      typeof error.body === "object" &&
      "message" in error.body
    ) {
      return String(error.body.message);
    }

    if ("message" in error) {
      return String(error.message);
    }
  }

  return "Could not update your username right now.";
}

export async function saveProfileUsername(
  _previousState: ProfileUsernameFormState,
  formData: FormData,
): Promise<ProfileUsernameFormState> {
  const session = await getAuthSession();

  if (!session?.user || !auth) {
    return {
      status: "error",
      message: "You need to sign in again before updating your username.",
    };
  }

  const identity = getSessionIdentityFromUnknown(session.user);

  if (!identity) {
    return {
      status: "error",
      message:
        "The current session is missing account details. Sign in again and retry.",
    };
  }

  const parsedUsername = usernameSchema.safeParse(
    getValue(formData, "username"),
  );
  const currentUsername = normalizeUsername(identity.username);
  const currentDisplayName = identity.displayName.trim() || currentUsername;

  if (!parsedUsername.success) {
    return {
      status: "error",
      message: "Please fix the username and try again.",
      username: currentUsername,
      displayName: currentDisplayName,
      errors: {
        username:
          parsedUsername.error.issues[0]?.message ?? "Enter a valid username.",
      },
    };
  }

  const nextUsername = normalizeUsername(parsedUsername.data);
  const nextDisplayName =
    currentDisplayName === identity.username
      ? nextUsername
      : currentDisplayName;

  if (nextUsername === currentUsername) {
    return {
      status: "success",
      message: "Username already up to date.",
      username: currentUsername,
      displayName: nextDisplayName,
    };
  }

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        username: nextUsername,
        displayUsername: nextDisplayName,
        name: nextDisplayName,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const usernameError =
      /username.*taken|already taken|USERNAME_IS_ALREADY_TAKEN/i.test(message)
        ? "That username is already taken."
        : message;

    return {
      status: "error",
      message: usernameError,
      username: currentUsername,
      displayName: currentDisplayName,
      errors: {
        username: usernameError,
      },
    };
  }

  const [scoresSynced, likesSynced] = await Promise.all([
    syncStoredGameScoreIdentity({
      userId: identity.userId,
      username: nextUsername,
      displayName: nextDisplayName,
    }),
    syncStoredBlogLikeIdentity({
      userId: identity.userId,
      username: nextUsername,
      displayName: nextDisplayName,
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/settings");
  revalidatePath(`/profile/${identity.userId}`);

  return {
    status: "success",
    message:
      scoresSynced && likesSynced
        ? "Username updated. Saved leaderboard and reaction activity now use the new name."
        : "Username updated. Some saved activity may keep the old name until it refreshes.",
    username: nextUsername,
    displayName: nextDisplayName,
  };
}

function normalizeSocialHandle(value: string, platformLabel: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return {
      value: "",
      error: null,
    };
  }

  if (
    normalizedValue.includes("://") ||
    normalizedValue.startsWith("www.") ||
    normalizedValue.includes("/")
  ) {
    return {
      value: "",
      error: `Enter your ${platformLabel} screen name, not a full URL.`,
    };
  }

  if (normalizedValue.length < 2) {
    return {
      value: "",
      error: `${platformLabel} screen name must be at least 2 characters.`,
    };
  }

  if (normalizedValue.length > 40) {
    return {
      value: "",
      error: `${platformLabel} screen name must be 40 characters or fewer.`,
    };
  }

  if (/[<>\n\r\t]/.test(normalizedValue)) {
    return {
      value: "",
      error: `Enter a valid ${platformLabel} screen name.`,
    };
  }

  return {
    value: normalizedValue,
    error: null,
  };
}

export async function saveProfileSocialLinks(
  _previousState: ProfileSocialLinksFormState,
  formData: FormData,
): Promise<ProfileSocialLinksFormState> {
  const session = await getAuthSession();

  if (!session?.user) {
    return {
      status: "error",
      message:
        "You need to sign in again before updating public account links.",
    };
  }

  const identity = getSessionIdentityFromUnknown(session.user);

  if (!identity) {
    return {
      status: "error",
      message:
        "The current session is missing profile details. Sign in again and retry.",
    };
  }

  const steamInput = getValue(formData, "steamHandle");
  const discordInput = getValue(formData, "discordHandle");
  const xboxInput = getValue(formData, "xboxHandle");
  const playstationInput = getValue(formData, "playstationHandle");
  const twitchInput = getValue(formData, "twitchHandle");
  const normalizedSocialLinks = {
    steamHandle: normalizeSocialHandle(steamInput, "Steam"),
    discordHandle: normalizeSocialHandle(discordInput, "Discord"),
    xboxHandle: normalizeSocialHandle(xboxInput, "Xbox"),
    playstationHandle: normalizeSocialHandle(playstationInput, "PlayStation"),
    twitchHandle: normalizeSocialHandle(twitchInput, "Twitch"),
  } satisfies Record<
    ProfileSocialLinksField,
    { value: string; error: string | null }
  >;
  const errors: Partial<Record<ProfileSocialLinksField, string>> = {};

  for (const [field, normalizedValue] of Object.entries(
    normalizedSocialLinks,
  ) as Array<
    [ProfileSocialLinksField, { value: string; error: string | null }]
  >) {
    if (normalizedValue.error) {
      errors[field] = normalizedValue.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted screen names and try again.",
      errors,
    };
  }

  const saved = await updateUserProfileSocialLinks({
    userId: identity.userId,
    socialLinks: {
      steamHandle: normalizedSocialLinks.steamHandle.value,
      discordHandle: normalizedSocialLinks.discordHandle.value,
      xboxHandle: normalizedSocialLinks.xboxHandle.value,
      playstationHandle: normalizedSocialLinks.playstationHandle.value,
      twitchHandle: normalizedSocialLinks.twitchHandle.value,
    },
  });

  if (!saved) {
    return {
      status: "error",
      message: "Could not update public account links right now.",
    };
  }

  revalidatePath("/settings");
  revalidatePath(`/profile/${identity.userId}`);

  return {
    status: "success",
    message: "Public screen names updated.",
  };
}

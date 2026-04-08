import { connectMongoClient, getMongoDatabase } from "@/lib/auth-db";
import {
  fallbackUsernameFromEmail,
  getStoredAuthUserById,
  getStoredAuthUserProfileIdentity,
  type StoredAuthSocialLinks,
  type StoredAuthUserDocument,
} from "@/lib/auth-users";
import { hasBetterAuthConfig } from "@/lib/env";
import { getUserSavedScores, type SavedGameScore } from "@/lib/game-scores";

export type PublicProfileSocialLinks = {
  steamHandle: string;
  discordHandle: string;
  xboxHandle: string;
  playstationHandle: string;
  twitchHandle: string;
};

type StoredProfileSocialLinks = Partial<PublicProfileSocialLinks> & {
  steamUrl?: string | null;
  discordUrl?: string | null;
  xboxUrl?: string | null;
  playstationUrl?: string | null;
  twitchUrl?: string | null;
};

type PublicProfileDocument = {
  userId: string;
  socialLinks?: StoredProfileSocialLinks | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type PublicProfile = {
  userId: string;
  username: string;
  displayName: string;
  socialLinks: PublicProfileSocialLinks;
  savedScores: SavedGameScore[];
};

function normalizeSocialLinkValue(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function deriveHandleFromLegacyValue(value?: string | null) {
  const normalizedValue = normalizeSocialLinkValue(value);

  if (!normalizedValue) {
    return "";
  }

  if (!normalizedValue.includes("://")) {
    return normalizedValue;
  }

  try {
    const url = new URL(normalizedValue);
    const lastPathSegment = url.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment).trim())
      .filter(Boolean)
      .at(-1);

    return lastPathSegment || normalizedValue;
  } catch {
    return normalizedValue;
  }
}

function createEmptyProfileSocialLinks(): PublicProfileSocialLinks {
  return {
    steamHandle: "",
    discordHandle: "",
    xboxHandle: "",
    playstationHandle: "",
    twitchHandle: "",
  };
}

async function getProfileDocumentByUserId(userId: string) {
  if (!hasBetterAuthConfig()) {
    return null;
  }

  await connectMongoClient();

  const database = getMongoDatabase();

  if (!database) {
    return null;
  }

  return database.collection<PublicProfileDocument>("profile").findOne(
    { userId },
    {
      projection: {
        _id: 0,
        userId: 1,
        socialLinks: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  );
}

function getProfileSocialLinksFromSources(
  profileDocument?: PublicProfileDocument | null,
  authUser?: StoredAuthUserDocument | null,
): PublicProfileSocialLinks {
  const authUserSocialLinks = authUser?.socialLinks as
    | StoredAuthSocialLinks
    | null
    | undefined;

  return {
    ...createEmptyProfileSocialLinks(),
    steamHandle:
      normalizeSocialLinkValue(profileDocument?.socialLinks?.steamHandle) ||
      deriveHandleFromLegacyValue(profileDocument?.socialLinks?.steamUrl) ||
      normalizeSocialLinkValue(authUserSocialLinks?.steamHandle) ||
      deriveHandleFromLegacyValue(authUserSocialLinks?.steamUrl),
    discordHandle:
      normalizeSocialLinkValue(profileDocument?.socialLinks?.discordHandle) ||
      deriveHandleFromLegacyValue(profileDocument?.socialLinks?.discordUrl) ||
      normalizeSocialLinkValue(authUserSocialLinks?.discordHandle) ||
      deriveHandleFromLegacyValue(authUserSocialLinks?.discordUrl),
    xboxHandle:
      normalizeSocialLinkValue(profileDocument?.socialLinks?.xboxHandle) ||
      deriveHandleFromLegacyValue(profileDocument?.socialLinks?.xboxUrl) ||
      normalizeSocialLinkValue(authUserSocialLinks?.xboxHandle) ||
      deriveHandleFromLegacyValue(authUserSocialLinks?.xboxUrl),
    playstationHandle:
      normalizeSocialLinkValue(
        profileDocument?.socialLinks?.playstationHandle,
      ) ||
      deriveHandleFromLegacyValue(
        profileDocument?.socialLinks?.playstationUrl,
      ) ||
      normalizeSocialLinkValue(authUserSocialLinks?.playstationHandle) ||
      deriveHandleFromLegacyValue(authUserSocialLinks?.playstationUrl),
    twitchHandle:
      normalizeSocialLinkValue(profileDocument?.socialLinks?.twitchHandle) ||
      deriveHandleFromLegacyValue(profileDocument?.socialLinks?.twitchUrl) ||
      normalizeSocialLinkValue(authUserSocialLinks?.twitchHandle) ||
      deriveHandleFromLegacyValue(authUserSocialLinks?.twitchUrl),
  };
}

export async function getUserProfileSocialLinks(userId: string) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return createEmptyProfileSocialLinks();
  }

  const [profileDocument, authUser] = await Promise.all([
    getProfileDocumentByUserId(normalizedUserId),
    getStoredAuthUserById(normalizedUserId),
  ]);

  return getProfileSocialLinksFromSources(profileDocument, authUser);
}

export async function updateUserProfileSocialLinks({
  userId,
  socialLinks,
}: {
  userId: string;
  socialLinks: PublicProfileSocialLinks;
}) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId || !hasBetterAuthConfig()) {
    return false;
  }

  await connectMongoClient();

  const database = getMongoDatabase();

  if (!database) {
    return false;
  }

  const nextSocialLinks: PublicProfileSocialLinks = {
    steamHandle: socialLinks.steamHandle.trim(),
    discordHandle: socialLinks.discordHandle.trim(),
    xboxHandle: socialLinks.xboxHandle.trim(),
    playstationHandle: socialLinks.playstationHandle.trim(),
    twitchHandle: socialLinks.twitchHandle.trim(),
  };

  const result = await database
    .collection<PublicProfileDocument>("profile")
    .updateOne(
      { userId: normalizedUserId },
      {
        $set: {
          socialLinks: nextSocialLinks,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: normalizedUserId,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

  return result.acknowledged;
}

export async function getPublicProfileById(userId: string) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return null;
  }
  const [profileDocument, authUser, savedScores] = await Promise.all([
    getProfileDocumentByUserId(normalizedUserId),
    getStoredAuthUserById(normalizedUserId),
    getUserSavedScores(normalizedUserId),
  ]);

  if (authUser?.banned === true) {
    return null;
  }

  if (!authUser && savedScores.length === 0) {
    return null;
  }

  const savedScoreIdentity = savedScores[0] ?? null;
  const authIdentity = authUser
    ? getStoredAuthUserProfileIdentity(authUser)
    : null;
  const username =
    authIdentity?.username ||
    savedScoreIdentity?.username ||
    fallbackUsernameFromEmail(authUser?.email) ||
    normalizedUserId;
  const displayName =
    authIdentity?.displayName ||
    savedScoreIdentity?.displayName ||
    username;
  const socialLinks = getProfileSocialLinksFromSources(
    profileDocument,
    authUser,
  );

  return {
    userId: normalizedUserId,
    username,
    displayName,
    socialLinks,
    savedScores,
  } satisfies PublicProfile;
}

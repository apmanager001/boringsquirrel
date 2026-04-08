import { ObjectId } from "mongodb";
import { connectMongoClient, getMongoDatabase } from "@/lib/auth-db";
import { hasBetterAuthConfig } from "@/lib/env";

export type StoredAuthSocialLinks = {
  steamHandle?: string | null;
  discordHandle?: string | null;
  xboxHandle?: string | null;
  playstationHandle?: string | null;
  twitchHandle?: string | null;
  steamUrl?: string | null;
  discordUrl?: string | null;
  xboxUrl?: string | null;
  playstationUrl?: string | null;
  twitchUrl?: string | null;
};

export type StoredAuthUserDocument = {
  _id?: ObjectId | string;
  id?: string;
  email?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  name?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  socialLinks?: StoredAuthSocialLinks | null;
};

export function fallbackUsernameFromEmail(email?: string | null) {
  if (!email) {
    return null;
  }

  const candidate = email.split("@")[0]?.trim();
  return candidate ? candidate : null;
}

export function getStoredAuthUserResolvedId(user: StoredAuthUserDocument) {
  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id.trim();
  }

  if (typeof user._id === "string" && user._id.trim().length > 0) {
    return user._id.trim();
  }

  if (user._id instanceof ObjectId) {
    return user._id.toString();
  }

  return null;
}

export function getStoredAuthUserProfileIdentity(user: StoredAuthUserDocument) {
  const resolvedId = getStoredAuthUserResolvedId(user);
  const username =
    typeof user.username === "string" && user.username.trim().length > 0
      ? user.username.trim()
      : fallbackUsernameFromEmail(user.email) || resolvedId || "player";
  const displayName =
    typeof user.displayUsername === "string" &&
    user.displayUsername.trim().length > 0
      ? user.displayUsername.trim()
      : typeof user.name === "string" && user.name.trim().length > 0
        ? user.name.trim()
        : username;

  return {
    userId: resolvedId,
    username,
    displayName,
    banned: user.banned === true,
  };
}

function createAuthUserIdQuery(userIds: string[]) {
  const normalizedUserIds = Array.from(
    new Set(userIds.map((userId) => userId.trim()).filter(Boolean)),
  );

  const objectIds = normalizedUserIds.flatMap((userId) =>
    ObjectId.isValid(userId) ? [new ObjectId(userId)] : [],
  );

  if (normalizedUserIds.length === 0) {
    return null;
  }

  if (objectIds.length === 0) {
    return { id: { $in: normalizedUserIds } };
  }

  return {
    $or: [
      { id: { $in: normalizedUserIds } },
      { _id: { $in: objectIds } },
    ],
  };
}

export async function getStoredAuthUserById(userId: string) {
  const query = createAuthUserIdQuery([userId]);

  if (!query || !hasBetterAuthConfig()) {
    return null;
  }

  await connectMongoClient();

  const database = getMongoDatabase();

  if (!database) {
    return null;
  }

  return database.collection<StoredAuthUserDocument>("user").findOne(query, {
    projection: {
      _id: 1,
      id: 1,
      email: 1,
      username: 1,
      displayUsername: 1,
      name: 1,
      role: 1,
      banned: 1,
      banReason: 1,
      socialLinks: 1,
    },
  });
}

export async function getStoredAuthUsersByIds(userIds: string[]) {
  const query = createAuthUserIdQuery(userIds);

  if (!query || !hasBetterAuthConfig()) {
    return new Map<string, StoredAuthUserDocument>();
  }

  await connectMongoClient();

  const database = getMongoDatabase();

  if (!database) {
    return new Map<string, StoredAuthUserDocument>();
  }

  const documents = await database
    .collection<StoredAuthUserDocument>("user")
    .find(query, {
      projection: {
        _id: 1,
        id: 1,
        email: 1,
        username: 1,
        displayUsername: 1,
        name: 1,
        role: 1,
        banned: 1,
        banReason: 1,
        socialLinks: 1,
      },
    })
    .toArray();

  return new Map(
    documents.flatMap((document) => {
      const resolvedId = getStoredAuthUserResolvedId(document);

      return resolvedId ? ([[resolvedId, document]] as const) : [];
    }),
  );
}
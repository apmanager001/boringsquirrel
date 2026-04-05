import { connectMongoClient, getMongoDatabase } from "@/lib/auth-db";
import { hasBetterAuthConfig } from "@/lib/env";
import { getUserSavedScores, type SavedGameScore } from "@/lib/game-scores";

type PublicAuthUserDocument = {
  id: string;
  email?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  name?: string | null;
};

export type PublicProfile = {
  userId: string;
  username: string;
  displayName: string;
  savedScores: SavedGameScore[];
};

function fallbackUsernameFromEmail(email?: string | null) {
  if (!email) {
    return null;
  }

  const candidate = email.split("@")[0]?.trim();
  return candidate ? candidate : null;
}

async function getAuthUserById(userId: string) {
  if (!hasBetterAuthConfig()) {
    return null;
  }

  await connectMongoClient();

  const database = getMongoDatabase();

  if (!database) {
    return null;
  }

  return database.collection<PublicAuthUserDocument>("user").findOne(
    { id: userId },
    {
      projection: {
        _id: 0,
        id: 1,
        email: 1,
        username: 1,
        displayUsername: 1,
        name: 1,
      },
    },
  );
}

export async function getPublicProfileById(userId: string) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return null;
  }

  const [authUser, savedScores] = await Promise.all([
    getAuthUserById(normalizedUserId),
    getUserSavedScores(normalizedUserId),
  ]);

  if (!authUser && savedScores.length === 0) {
    return null;
  }

  const savedScoreIdentity = savedScores[0] ?? null;
  const username =
    authUser?.username?.trim() ||
    savedScoreIdentity?.username ||
    fallbackUsernameFromEmail(authUser?.email) ||
    normalizedUserId;
  const displayName =
    authUser?.displayUsername?.trim() ||
    authUser?.name?.trim() ||
    savedScoreIdentity?.displayName ||
    username;

  return {
    userId: normalizedUserId,
    username,
    displayName,
    savedScores,
  } satisfies PublicProfile;
}

import type { GameEntry } from "@/lib/site";
import { connectToDatabase } from "@/lib/db";
import { CLASSIC_SCORE_KEY, normalizeScoreKey } from "@/lib/games/daily";
import { GameScoreModel } from "@/lib/models/game-score";

export type GameScoreDetailValue = string | number | boolean | null;
export type GameScoreDetails = Record<string, GameScoreDetailValue>;

export type SupportedScoreGameSlug = Extract<
  GameEntry["slug"],
  "sudoku" | "wordle" | "waffle" | "word-search" | "oilcap" | "acornsweeper"
>;

export type SavedGameScore = {
  userId: string;
  gameSlug: SupportedScoreGameSlug;
  scoreKey: string;
  username: string;
  displayName: string;
  score: number;
  details: GameScoreDetails;
  createdAt: string;
  updatedAt: string;
};

export type RankedGameScore = SavedGameScore & {
  rank: number;
  isViewer: boolean;
};

type GameScoreDocument = {
  _id?: string;
  gameSlug: SupportedScoreGameSlug;
  scoreKey?: string;
  userId: string;
  username: string;
  displayName: string;
  score: number;
  details?: GameScoreDetails;
  isHidden?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type SaveGameScoreInput = {
  gameSlug: SupportedScoreGameSlug;
  scoreKey?: string;
  userId: string;
  username: string;
  displayName: string;
  score: number;
  details: GameScoreDetails;
};

const legacyUniqueIndexName = "gameSlug_1_userId_1";
const legacyLeaderboardIndexName = "gameSlug_1_isHidden_1_score_-1_updatedAt_1";
const scopedUniqueIndexName = "gameSlug_1_scoreKey_1_userId_1";
const scopedLeaderboardIndexName =
  "gameSlug_1_scoreKey_1_isHidden_1_score_-1_updatedAt_1";

let ensureGameScoreIndexesPromise: Promise<void> | null = null;

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function normalizeDetails(details: GameScoreDetails) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as GameScoreDetails;
}

function isCollectionAlreadyExistsError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return message.includes("already exists");
}

function isIndexMissingError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return message.includes("index not found");
}

async function ensureGameScoreIndexes() {
  if (ensureGameScoreIndexesPromise) {
    return ensureGameScoreIndexesPromise;
  }

  ensureGameScoreIndexesPromise = (async () => {
    await GameScoreModel.createCollection().catch((error) => {
      if (!isCollectionAlreadyExistsError(error)) {
        throw error;
      }
    });

    await GameScoreModel.updateMany(
      { scoreKey: { $exists: false } },
      {
        $set: {
          scoreKey: CLASSIC_SCORE_KEY,
        },
      },
    );

    const indexes = await GameScoreModel.collection.indexes();

    if (indexes.some((index) => index.name === legacyUniqueIndexName)) {
      await GameScoreModel.collection
        .dropIndex(legacyUniqueIndexName)
        .catch((error) => {
          if (!isIndexMissingError(error)) {
            throw error;
          }
        });
    }

    if (indexes.some((index) => index.name === legacyLeaderboardIndexName)) {
      await GameScoreModel.collection
        .dropIndex(legacyLeaderboardIndexName)
        .catch((error) => {
          if (!isIndexMissingError(error)) {
            throw error;
          }
        });
    }

    await GameScoreModel.collection.createIndex(
      { gameSlug: 1, scoreKey: 1, userId: 1 },
      {
        unique: true,
        name: scopedUniqueIndexName,
      },
    );

    await GameScoreModel.collection.createIndex(
      { gameSlug: 1, scoreKey: 1, isHidden: 1, score: -1, updatedAt: 1 },
      {
        name: scopedLeaderboardIndexName,
      },
    );
  })().catch((error) => {
    ensureGameScoreIndexesPromise = null;
    throw error;
  });

  return ensureGameScoreIndexesPromise;
}

function toIsoString(value: Date | string | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (typeof value === "string") {
    return new Date(value).toISOString();
  }

  return value.toISOString();
}

function mapSavedGameScore(document: GameScoreDocument): SavedGameScore {
  return {
    userId: document.userId,
    gameSlug: document.gameSlug,
    scoreKey: normalizeScoreKey(document.scoreKey) ?? CLASSIC_SCORE_KEY,
    username: document.username,
    displayName: document.displayName,
    score: document.score,
    details: normalizeDetails(document.details ?? {}),
    createdAt: toIsoString(document.createdAt),
    updatedAt: toIsoString(document.updatedAt),
  };
}

export function isSupportedScoreGame(
  gameSlug: string,
): gameSlug is SupportedScoreGameSlug {
  return [
    "sudoku",
    "wordle",
    "waffle",
    "word-search",
    "oilcap",
    "acornsweeper",
  ].includes(gameSlug);
}

export async function getGameLeaderboard(
  gameSlug: SupportedScoreGameSlug,
  limit = 8,
  viewerUserId?: string,
  scoreKey = CLASSIC_SCORE_KEY,
) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      leaderboard: [] as RankedGameScore[],
      viewerBest: null as SavedGameScore | null,
    };
  }

  await ensureGameScoreIndexes();

  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const normalizedScoreKey = normalizeScoreKey(scoreKey) ?? CLASSIC_SCORE_KEY;
  const [leaderboardDocuments, viewerDocument] = await Promise.all([
    GameScoreModel.find({
      gameSlug,
      scoreKey: normalizedScoreKey,
      isHidden: { $ne: true },
    })
      .sort({ score: -1, updatedAt: 1 })
      .limit(safeLimit)
      .lean(),
    viewerUserId
      ? GameScoreModel.findOne({
          gameSlug,
          scoreKey: normalizedScoreKey,
          userId: viewerUserId,
          isHidden: { $ne: true },
        }).lean()
      : null,
  ]);

  const leaderboard = (leaderboardDocuments as GameScoreDocument[]).map(
    (document, index) => ({
      ...mapSavedGameScore(document),
      rank: index + 1,
      isViewer: document.userId === viewerUserId,
    }),
  );

  return {
    available: true,
    leaderboard,
    viewerBest: viewerDocument
      ? mapSavedGameScore(viewerDocument as GameScoreDocument)
      : null,
  };
}

export async function getUserSavedScores(userId: string) {
  const database = await connectToDatabase();

  if (!database) {
    return [] as SavedGameScore[];
  }

  await ensureGameScoreIndexes();

  const scoreDocuments = (await GameScoreModel.find({
    userId,
    isHidden: { $ne: true },
  })
    .sort({ updatedAt: -1 })
    .lean()) as GameScoreDocument[];

  return scoreDocuments.map(mapSavedGameScore);
}

export async function hideUserGameScores(userId: string) {
  const database = await connectToDatabase();

  if (!database) {
    return [] as SupportedScoreGameSlug[];
  }

  await ensureGameScoreIndexes();

  const affectedGameSlugs = (
    await GameScoreModel.distinct("gameSlug", {
      userId,
      isHidden: { $ne: true },
    })
  ).filter(isSupportedScoreGame);

  if (affectedGameSlugs.length === 0) {
    return [] as SupportedScoreGameSlug[];
  }

  await GameScoreModel.updateMany(
    { userId, isHidden: { $ne: true } },
    {
      $set: {
        isHidden: true,
      },
    },
  );

  return affectedGameSlugs;
}

export async function syncStoredGameScoreIdentity({
  userId,
  username,
  displayName,
}: {
  userId: string;
  username: string;
  displayName: string;
}) {
  const database = await connectToDatabase();

  if (!database) {
    return false;
  }

  await ensureGameScoreIndexes();

  await GameScoreModel.updateMany(
    { userId },
    {
      $set: {
        username,
        displayName,
      },
    },
  );

  return true;
}

export async function saveGameScore({
  gameSlug,
  scoreKey,
  userId,
  username,
  displayName,
  score,
  details,
}: SaveGameScoreInput) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      saved: false,
      improved: false,
      entry: null as SavedGameScore | null,
    };
  }

  await ensureGameScoreIndexes();

  const normalizedDetails = normalizeDetails(details);
  const normalizedScoreKey = normalizeScoreKey(scoreKey) ?? CLASSIC_SCORE_KEY;
  let existing = (await GameScoreModel.findOne({
    gameSlug,
    scoreKey: normalizedScoreKey,
    userId,
  }).lean()) as GameScoreDocument | null;

  if (!existing) {
    try {
      const created = await GameScoreModel.create({
        gameSlug,
        scoreKey: normalizedScoreKey,
        userId,
        username,
        displayName,
        score,
        details: normalizedDetails,
      });

      return {
        available: true,
        saved: true,
        improved: true,
        entry: mapSavedGameScore(created.toObject() as GameScoreDocument),
      };
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      existing = (await GameScoreModel.findOne({
        gameSlug,
        scoreKey: normalizedScoreKey,
        userId,
      }).lean()) as GameScoreDocument | null;
    }
  }

  if (existing && score <= existing.score) {
    if (
      existing.isHidden === true ||
      existing.username !== username ||
      existing.displayName !== displayName
    ) {
      await GameScoreModel.updateOne(
        { gameSlug, scoreKey: normalizedScoreKey, userId },
        {
          $set: {
            username,
            displayName,
            isHidden: false,
          },
        },
      );
    }

    return {
      available: true,
      saved: false,
      improved: false,
      entry: mapSavedGameScore({
        ...existing,
        username,
        displayName,
      }),
    };
  }

  const updated = (await GameScoreModel.findOneAndUpdate(
    { gameSlug, scoreKey: normalizedScoreKey, userId },
    {
      $set: {
        username,
        displayName,
        score,
        details: normalizedDetails,
        isHidden: false,
      },
      $setOnInsert: {
        gameSlug,
        scoreKey: normalizedScoreKey,
        userId,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).lean()) as GameScoreDocument | null;

  return {
    available: true,
    saved: true,
    improved: true,
    entry: updated ? mapSavedGameScore(updated) : null,
  };
}

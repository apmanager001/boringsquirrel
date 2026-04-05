import type { GameEntry } from "@/lib/site";
import { connectToDatabase } from "@/lib/db";
import { GameScoreModel } from "@/lib/models/game-score";

export type GameScoreDetailValue = string | number | boolean | null;
export type GameScoreDetails = Record<string, GameScoreDetailValue>;

export type SupportedScoreGameSlug = Extract<
  GameEntry["slug"],
  "sudoku" | "oilcap" | "acornsweeper"
>;

export type SavedGameScore = {
  userId: string;
  gameSlug: SupportedScoreGameSlug;
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
  userId: string;
  username: string;
  displayName: string;
  score: number;
  details?: GameScoreDetails;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type SaveGameScoreInput = {
  gameSlug: SupportedScoreGameSlug;
  userId: string;
  username: string;
  displayName: string;
  score: number;
  details: GameScoreDetails;
};

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
  return ["sudoku", "oilcap", "acornsweeper"].includes(gameSlug);
}

export async function getGameLeaderboard(
  gameSlug: SupportedScoreGameSlug,
  limit = 8,
  viewerUserId?: string,
) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      leaderboard: [] as RankedGameScore[],
      viewerBest: null as SavedGameScore | null,
    };
  }

  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const [leaderboardDocuments, viewerDocument] = await Promise.all([
    GameScoreModel.find({ gameSlug })
      .sort({ score: -1, updatedAt: 1 })
      .limit(safeLimit)
      .lean(),
    viewerUserId
      ? GameScoreModel.findOne({ gameSlug, userId: viewerUserId }).lean()
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

  const scoreDocuments = (await GameScoreModel.find({ userId })
    .sort({ updatedAt: -1 })
    .lean()) as GameScoreDocument[];

  return scoreDocuments.map(mapSavedGameScore);
}

export async function saveGameScore({
  gameSlug,
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

  const normalizedDetails = normalizeDetails(details);
  let existing = (await GameScoreModel.findOne({
    gameSlug,
    userId,
  }).lean()) as GameScoreDocument | null;

  if (!existing) {
    try {
      const created = await GameScoreModel.create({
        gameSlug,
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
        userId,
      }).lean()) as GameScoreDocument | null;
    }
  }

  if (existing && score <= existing.score) {
    if (
      existing.username !== username ||
      existing.displayName !== displayName
    ) {
      await GameScoreModel.updateOne(
        { gameSlug, userId },
        {
          $set: {
            username,
            displayName,
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
    { gameSlug, userId },
    {
      $set: {
        username,
        displayName,
        score,
        details: normalizedDetails,
      },
      $setOnInsert: {
        gameSlug,
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

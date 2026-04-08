import { model, models, Schema } from "mongoose";
import { CLASSIC_SCORE_KEY } from "@/lib/games/daily";

const supportedGameSlugs = [
  "sudoku",
  "wordle",
  "waffle",
  "word-search",
  "oilcap",
  "acornsweeper",
] as const;

const gameScoreSchema = new Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      enum: supportedGameSlugs,
      index: true,
    },
    scoreKey: {
      type: String,
      required: true,
      trim: true,
      default: CLASSIC_SCORE_KEY,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

gameScoreSchema.index(
  { gameSlug: 1, scoreKey: 1, userId: 1 },
  {
    unique: true,
    name: "gameSlug_1_scoreKey_1_userId_1",
  },
);
gameScoreSchema.index(
  { gameSlug: 1, scoreKey: 1, isHidden: 1, score: -1, updatedAt: 1 },
  {
    name: "gameSlug_1_scoreKey_1_isHidden_1_score_-1_updatedAt_1",
  },
);

export const GameScoreModel =
  models.GameScore || model("GameScore", gameScoreSchema);

import { model, models, Schema } from "mongoose";

const supportedGameSlugs = ["sudoku", "oilcap", "acornsweeper"] as const;

const gameScoreSchema = new Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      enum: supportedGameSlugs,
      index: true,
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
  },
  {
    timestamps: true,
  },
);

gameScoreSchema.index({ gameSlug: 1, userId: 1 }, { unique: true });
gameScoreSchema.index({ gameSlug: 1, score: -1, updatedAt: 1 });

export const GameScoreModel =
  models.GameScore || model("GameScore", gameScoreSchema);
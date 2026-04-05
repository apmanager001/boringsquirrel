import { model, models, Schema } from "mongoose";

const blogLikeSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
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
  },
  {
    timestamps: true,
  },
);

blogLikeSchema.index({ slug: 1, userId: 1 }, { unique: true });

export const BlogLikeModel = models.BlogLike || model("BlogLike", blogLikeSchema);
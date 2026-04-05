import { model, models, Schema } from "mongoose";

const blogMetricSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const BlogMetricModel =
  models.BlogMetric || model("BlogMetric", blogMetricSchema);

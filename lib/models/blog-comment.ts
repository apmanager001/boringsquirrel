import { model, models, Schema } from "mongoose";
import { BLOG_COMMENT_MAX_LENGTH } from "@/lib/blog-comment-schemas";

const blogCommentSchema = new Schema(
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
      index: true,
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
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: BLOG_COMMENT_MAX_LENGTH,
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

blogCommentSchema.index({ slug: 1, isHidden: 1, createdAt: 1 });
blogCommentSchema.index({ userId: 1, createdAt: -1 });

export const BlogCommentModel =
  models.BlogComment || model("BlogComment", blogCommentSchema);

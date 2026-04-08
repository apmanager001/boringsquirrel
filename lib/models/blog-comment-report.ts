import { model, models, Schema } from "mongoose";
import { BLOG_COMMENT_MAX_LENGTH } from "@/lib/blog-comment-schemas";

const blogCommentReportSchema = new Schema(
  {
    commentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    commentBody: {
      type: String,
      required: true,
      trim: true,
      maxlength: BLOG_COMMENT_MAX_LENGTH,
    },
    commentAuthorUserId: {
      type: String,
      required: true,
      trim: true,
    },
    commentAuthorUsername: {
      type: String,
      required: true,
      trim: true,
    },
    commentAuthorDisplayName: {
      type: String,
      required: true,
      trim: true,
    },
    reporterUserId: {
      type: String,
      required: true,
      trim: true,
    },
    reporterUsername: {
      type: String,
      required: true,
      trim: true,
    },
    reporterDisplayName: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readByUserId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

blogCommentReportSchema.index({ isRead: 1, createdAt: -1 });
blogCommentReportSchema.index(
  { commentId: 1, reporterUserId: 1 },
  { unique: true },
);

export const BlogCommentReportModel =
  models.BlogCommentReport ||
  model("BlogCommentReport", blogCommentReportSchema);

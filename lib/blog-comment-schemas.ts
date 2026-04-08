import { z } from "zod";

export const BLOG_COMMENT_MAX_LENGTH = 600;

export const blogCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Enter a comment before posting.")
    .max(
      BLOG_COMMENT_MAX_LENGTH,
      `Comments must be ${BLOG_COMMENT_MAX_LENGTH} characters or fewer.`,
    ),
});

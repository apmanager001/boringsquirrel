import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { BlogCommentModel } from "@/lib/models/blog-comment";
import { BlogCommentReportModel } from "@/lib/models/blog-comment-report";

export type BlogComment = {
  id: string;
  slug: string;
  userId: string;
  username: string;
  displayName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogCommentThread = {
  available: boolean;
  comments: BlogComment[];
  reportedCommentIds: string[];
};

export type AdminBlogCommentReportFilter = "all" | "open" | "reviewed";

export type AdminBlogCommentReport = {
  id: string;
  commentId: string;
  slug: string;
  commentBody: string;
  commentAuthorUserId: string;
  commentAuthorUsername: string;
  commentAuthorDisplayName: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName: string;
  isRead: boolean;
  commentExists: boolean;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  readByUserId: string | null;
};

type BlogCommentDocument = {
  _id: { toString(): string } | string;
  slug: string;
  userId: string;
  username: string;
  displayName: string;
  body: string;
  isHidden?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type BlogCommentReportDocument = {
  _id: { toString(): string } | string;
  commentId: string;
  slug: string;
  commentBody: string;
  commentAuthorUserId: string;
  commentAuthorUsername: string;
  commentAuthorDisplayName: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName: string;
  isRead?: boolean | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  readAt?: Date | string | null;
  readByUserId?: string | null;
};

type ReportBlogCommentResult = {
  available: boolean;
  status: "reported" | "already-reported" | "missing" | "own-comment";
};

export const ADMIN_BLOG_COMMENT_REPORT_LIMIT = 200;

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return new Date(value).toISOString();
  }

  return value.toISOString();
}

function toRequiredIsoString(value: Date | string | undefined) {
  return toIsoString(value) ?? new Date(0).toISOString();
}

function mapBlogComment(document: BlogCommentDocument): BlogComment {
  return {
    id:
      typeof document._id === "string" ? document._id : document._id.toString(),
    slug: document.slug,
    userId: document.userId,
    username: document.username,
    displayName: document.displayName,
    body: document.body,
    createdAt: toRequiredIsoString(document.createdAt),
    updatedAt: toRequiredIsoString(document.updatedAt),
  };
}

function mapAdminBlogCommentReport(
  document: BlogCommentReportDocument,
  existingCommentIds: Set<string>,
): AdminBlogCommentReport {
  return {
    id:
      typeof document._id === "string" ? document._id : document._id.toString(),
    commentId: document.commentId,
    slug: document.slug,
    commentBody: document.commentBody,
    commentAuthorUserId: document.commentAuthorUserId,
    commentAuthorUsername: document.commentAuthorUsername,
    commentAuthorDisplayName: document.commentAuthorDisplayName,
    reporterUserId: document.reporterUserId,
    reporterUsername: document.reporterUsername,
    reporterDisplayName: document.reporterDisplayName,
    isRead: document.isRead === true,
    commentExists: existingCommentIds.has(document.commentId),
    createdAt: toRequiredIsoString(document.createdAt),
    updatedAt: toRequiredIsoString(document.updatedAt),
    readAt: toIsoString(document.readAt),
    readByUserId:
      typeof document.readByUserId === "string" &&
      document.readByUserId.length > 0
        ? document.readByUserId
        : null,
  };
}

export function normalizeAdminBlogCommentReportFilter(
  value: string | null | undefined,
): AdminBlogCommentReportFilter {
  if (value === "open" || value === "reviewed") {
    return value;
  }

  return "all";
}

function getBlogCommentReportFilterQuery(filter: AdminBlogCommentReportFilter) {
  if (filter === "reviewed") {
    return { isRead: true };
  }

  if (filter === "open") {
    return { isRead: { $ne: true } };
  }

  return {};
}

export async function getBlogCommentThread(
  slug: string,
  viewerUserId?: string,
): Promise<BlogCommentThread> {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      comments: [],
      reportedCommentIds: [],
    };
  }

  const [commentDocuments, reportDocuments] = await Promise.all([
    BlogCommentModel.find({ slug, isHidden: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean(),
    viewerUserId
      ? BlogCommentReportModel.find({ slug, reporterUserId: viewerUserId })
          .select({ commentId: 1, _id: 0 })
          .lean()
      : [],
  ]);

  return {
    available: true,
    comments: (commentDocuments as BlogCommentDocument[]).map(mapBlogComment),
    reportedCommentIds: Array.from(
      new Set(
        (reportDocuments as Array<{ commentId?: string }>).flatMap((report) =>
          typeof report.commentId === "string" ? [report.commentId] : [],
        ),
      ),
    ),
  };
}

export async function createBlogComment({
  slug,
  body,
  userId,
  username,
  displayName,
}: {
  slug: string;
  body: string;
  userId: string;
  username: string;
  displayName: string;
}) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      comment: null,
    };
  }

  const createdComment = await BlogCommentModel.create({
    slug,
    body,
    userId,
    username,
    displayName,
  });

  return {
    available: true,
    comment: mapBlogComment(createdComment.toObject() as BlogCommentDocument),
  };
}

export async function reportBlogComment({
  commentId,
  slug,
  reporterUserId,
  reporterUsername,
  reporterDisplayName,
}: {
  commentId: string;
  slug: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName: string;
}): Promise<ReportBlogCommentResult> {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      status: "missing",
    };
  }

  if (!Types.ObjectId.isValid(commentId)) {
    return {
      available: true,
      status: "missing",
    };
  }

  const commentDocument = (await BlogCommentModel.findOne({
    _id: commentId,
    slug,
    isHidden: { $ne: true },
  }).lean()) as BlogCommentDocument | null;

  if (!commentDocument) {
    return {
      available: true,
      status: "missing",
    };
  }

  if (commentDocument.userId === reporterUserId) {
    return {
      available: true,
      status: "own-comment",
    };
  }

  try {
    await BlogCommentReportModel.create({
      commentId,
      slug,
      commentBody: commentDocument.body,
      commentAuthorUserId: commentDocument.userId,
      commentAuthorUsername: commentDocument.username,
      commentAuthorDisplayName: commentDocument.displayName,
      reporterUserId,
      reporterUsername,
      reporterDisplayName,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    return {
      available: true,
      status: "already-reported",
    };
  }

  return {
    available: true,
    status: "reported",
  };
}

export async function getAdminBlogCommentReports(
  filter: AdminBlogCommentReportFilter = "all",
) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      filteredCount: 0,
      totalCount: 0,
      openCount: 0,
      reviewedCount: 0,
      reports: [] as AdminBlogCommentReport[],
    };
  }

  const query = getBlogCommentReportFilterQuery(filter);
  const sort =
    filter === "reviewed"
      ? ([
          ["readAt", -1],
          ["createdAt", -1],
        ] as [string, 1 | -1][])
      : filter === "open"
        ? ([["createdAt", -1]] as [string, 1 | -1][])
        : ([
            ["isRead", 1],
            ["createdAt", -1],
          ] as [string, 1 | -1][]);

  const [reportDocuments, filteredCount, totalCount, openCount] =
    await Promise.all([
      BlogCommentReportModel.find(query)
        .sort(sort)
        .limit(ADMIN_BLOG_COMMENT_REPORT_LIMIT)
        .lean(),
      BlogCommentReportModel.countDocuments(query),
      BlogCommentReportModel.countDocuments({}),
      BlogCommentReportModel.countDocuments({ isRead: { $ne: true } }),
    ]);

  const uniqueCommentIds = Array.from(
    new Set(
      (reportDocuments as BlogCommentReportDocument[])
        .map((report) => report.commentId)
        .filter((commentId) => Types.ObjectId.isValid(commentId)),
    ),
  );

  const existingCommentDocuments =
    uniqueCommentIds.length > 0
      ? ((await BlogCommentModel.find({
          _id: {
            $in: uniqueCommentIds.map(
              (commentId) => new Types.ObjectId(commentId),
            ),
          },
          isHidden: { $ne: true },
        })
          .select({ _id: 1 })
          .lean()) as Array<{ _id: { toString(): string } | string }>)
      : [];

  const existingCommentIds = new Set(
    existingCommentDocuments.map((document) =>
      typeof document._id === "string" ? document._id : document._id.toString(),
    ),
  );

  return {
    available: true,
    filteredCount,
    totalCount,
    openCount,
    reviewedCount: Math.max(totalCount - openCount, 0),
    reports: (reportDocuments as BlogCommentReportDocument[]).map((document) =>
      mapAdminBlogCommentReport(document, existingCommentIds),
    ),
  };
}

export async function setBlogCommentReportReadState({
  reportId,
  isRead,
  actorUserId,
}: {
  reportId: string;
  isRead: boolean;
  actorUserId: string;
}) {
  const database = await connectToDatabase();

  if (!database || !Types.ObjectId.isValid(reportId)) {
    return false;
  }

  const updatedReport = await BlogCommentReportModel.findByIdAndUpdate(
    reportId,
    isRead
      ? {
          $set: {
            isRead: true,
            readAt: new Date(),
            readByUserId: actorUserId,
          },
        }
      : {
          $set: {
            isRead: false,
          },
          $unset: {
            readAt: "",
            readByUserId: "",
          },
        },
    {
      new: true,
    },
  ).lean();

  return Boolean(updatedReport);
}

export async function deleteBlogCommentAndReports(commentId: string) {
  const database = await connectToDatabase();

  if (!database || !Types.ObjectId.isValid(commentId)) {
    return false;
  }

  const [deletedComment, deletedReports] = await Promise.all([
    BlogCommentModel.findByIdAndDelete(commentId).lean(),
    BlogCommentReportModel.deleteMany({ commentId }),
  ]);

  return Boolean(deletedComment) || deletedReports.deletedCount > 0;
}

export async function hideUserBlogComments(userId: string) {
  const database = await connectToDatabase();

  if (!database) {
    return [] as string[];
  }

  const affectedSlugs = (await BlogCommentModel.distinct("slug", {
    userId,
    isHidden: { $ne: true },
  })) as string[];

  if (affectedSlugs.length === 0) {
    return [] as string[];
  }

  await BlogCommentModel.updateMany(
    { userId, isHidden: { $ne: true } },
    {
      $set: {
        isHidden: true,
      },
    },
  );

  return affectedSlugs;
}

export async function syncStoredBlogCommentIdentity({
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

  await Promise.all([
    BlogCommentModel.updateMany(
      { userId },
      {
        $set: {
          username,
          displayName,
        },
      },
    ),
    BlogCommentReportModel.updateMany(
      { commentAuthorUserId: userId },
      {
        $set: {
          commentAuthorUsername: username,
          commentAuthorDisplayName: displayName,
        },
      },
    ),
    BlogCommentReportModel.updateMany(
      { reporterUserId: userId },
      {
        $set: {
          reporterUsername: username,
          reporterDisplayName: displayName,
        },
      },
    ),
  ]);

  return true;
}

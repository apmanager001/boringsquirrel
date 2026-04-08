import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  getStoredAuthUserById,
  getStoredAuthUserProfileIdentity,
  getStoredAuthUsersByIds,
} from "@/lib/auth-users";
import { hideUserBlogComments } from "@/lib/blog-comments";
import {
  hideUserGameScores,
  type SupportedScoreGameSlug,
} from "@/lib/game-scores";
import { ProfileReportModel } from "@/lib/models/profile-report";
import {
  getUserProfileSocialLinks,
  type PublicProfileSocialLinks,
} from "@/lib/profiles";

export type AdminProfileReportFilter = "all" | "open" | "reviewed";

export type AdminProfileReport = {
  id: string;
  reportedUserId: string;
  reportedUsername: string;
  reportedDisplayName: string;
  reportedSocialLinks: PublicProfileSocialLinks;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName: string;
  isRead: boolean;
  reportedUserExists: boolean;
  reportedUserIsBanned: boolean;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  readByUserId: string | null;
};

type ProfileReportDocument = {
  _id: { toString(): string } | string;
  reportedUserId: string;
  reportedUsername: string;
  reportedDisplayName: string;
  reportedSocialLinks?: Partial<PublicProfileSocialLinks> | null;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName: string;
  isRead?: boolean | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  readAt?: Date | string | null;
  readByUserId?: string | null;
};

type ReportUserProfileResult = {
  available: boolean;
  status:
    | "reported"
    | "already-reported"
    | "missing"
    | "own-profile"
    | "already-banned";
};

export const ADMIN_PROFILE_REPORT_LIMIT = 200;

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

function createEmptyProfileSocialLinks(): PublicProfileSocialLinks {
  return {
    steamHandle: "",
    discordHandle: "",
    xboxHandle: "",
    playstationHandle: "",
    twitchHandle: "",
  };
}

function normalizeProfileSocialLinks(
  socialLinks?: Partial<PublicProfileSocialLinks> | null,
) {
  return {
    ...createEmptyProfileSocialLinks(),
    steamHandle:
      typeof socialLinks?.steamHandle === "string"
        ? socialLinks.steamHandle.trim()
        : "",
    discordHandle:
      typeof socialLinks?.discordHandle === "string"
        ? socialLinks.discordHandle.trim()
        : "",
    xboxHandle:
      typeof socialLinks?.xboxHandle === "string"
        ? socialLinks.xboxHandle.trim()
        : "",
    playstationHandle:
      typeof socialLinks?.playstationHandle === "string"
        ? socialLinks.playstationHandle.trim()
        : "",
    twitchHandle:
      typeof socialLinks?.twitchHandle === "string"
        ? socialLinks.twitchHandle.trim()
        : "",
  } satisfies PublicProfileSocialLinks;
}

function mapAdminProfileReport(
  document: ProfileReportDocument,
  userState: { exists: boolean; banned: boolean },
): AdminProfileReport {
  return {
    id:
      typeof document._id === "string" ? document._id : document._id.toString(),
    reportedUserId: document.reportedUserId,
    reportedUsername: document.reportedUsername,
    reportedDisplayName: document.reportedDisplayName,
    reportedSocialLinks: normalizeProfileSocialLinks(
      document.reportedSocialLinks,
    ),
    reporterUserId: document.reporterUserId,
    reporterUsername: document.reporterUsername,
    reporterDisplayName: document.reporterDisplayName,
    isRead: document.isRead === true,
    reportedUserExists: userState.exists,
    reportedUserIsBanned: userState.banned,
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

function getProfileReportFilterQuery(filter: AdminProfileReportFilter) {
  if (filter === "reviewed") {
    return { isRead: true };
  }

  if (filter === "open") {
    return { isRead: { $ne: true } };
  }

  return {};
}

export function normalizeAdminProfileReportFilter(
  value: string | null | undefined,
): AdminProfileReportFilter {
  if (value === "open" || value === "reviewed") {
    return value;
  }

  return "all";
}

export async function getProfileReportState({
  reportedUserId,
  viewerUserId,
}: {
  reportedUserId: string;
  viewerUserId?: string;
}) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      alreadyReported: false,
      isOwnProfile: viewerUserId === reportedUserId,
    };
  }

  if (!viewerUserId) {
    return {
      available: true,
      alreadyReported: false,
      isOwnProfile: false,
    };
  }

  const existingReport = await ProfileReportModel.findOne({
    reportedUserId,
    reporterUserId: viewerUserId,
  })
    .select({ _id: 1 })
    .lean();

  return {
    available: true,
    alreadyReported: Boolean(existingReport),
    isOwnProfile: viewerUserId === reportedUserId,
  };
}

export async function reportUserProfile({
  reportedUserId,
  reporterUserId,
  reporterUsername,
  reporterDisplayName,
}: {
  reportedUserId: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName: string;
}): Promise<ReportUserProfileResult> {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      status: "missing",
    };
  }

  if (reportedUserId === reporterUserId) {
    return {
      available: true,
      status: "own-profile",
    };
  }

  const reportedUser = await getStoredAuthUserById(reportedUserId);

  if (!reportedUser) {
    return {
      available: true,
      status: "missing",
    };
  }

  if (reportedUser.banned === true) {
    return {
      available: true,
      status: "already-banned",
    };
  }

  const reportedIdentity = getStoredAuthUserProfileIdentity(reportedUser);
  const reportedSocialLinks = await getUserProfileSocialLinks(reportedUserId);

  try {
    await ProfileReportModel.create({
      reportedUserId,
      reportedUsername: reportedIdentity.username,
      reportedDisplayName: reportedIdentity.displayName,
      reportedSocialLinks,
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

export async function getAdminProfileReports(
  filter: AdminProfileReportFilter = "all",
) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      filteredCount: 0,
      totalCount: 0,
      openCount: 0,
      reviewedCount: 0,
      reports: [] as AdminProfileReport[],
    };
  }

  const query = getProfileReportFilterQuery(filter);
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
      ProfileReportModel.find(query)
        .sort(sort)
        .limit(ADMIN_PROFILE_REPORT_LIMIT)
        .lean(),
      ProfileReportModel.countDocuments(query),
      ProfileReportModel.countDocuments({}),
      ProfileReportModel.countDocuments({ isRead: { $ne: true } }),
    ]);

  const authUsers = await getStoredAuthUsersByIds(
    (reportDocuments as ProfileReportDocument[]).map(
      (report) => report.reportedUserId,
    ),
  );

  return {
    available: true,
    filteredCount,
    totalCount,
    openCount,
    reviewedCount: Math.max(totalCount - openCount, 0),
    reports: (reportDocuments as ProfileReportDocument[]).map((document) => {
      const authUser = authUsers.get(document.reportedUserId);

      return mapAdminProfileReport(document, {
        exists: Boolean(authUser),
        banned: authUser?.banned === true,
      });
    }),
  };
}

export async function setProfileReportReadState({
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

  const updatedReport = await ProfileReportModel.findByIdAndUpdate(
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

export async function hideReportedUserPublicContent({
  userId,
  actorUserId,
}: {
  userId: string;
  actorUserId: string;
}) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      hiddenCommentSlugs: [] as string[],
      hiddenGameSlugs: [] as SupportedScoreGameSlug[],
    };
  }

  const [hiddenCommentSlugs, hiddenGameSlugs] = await Promise.all([
    hideUserBlogComments(userId),
    hideUserGameScores(userId),
    ProfileReportModel.updateMany(
      { reportedUserId: userId, isRead: { $ne: true } },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
          readByUserId: actorUserId,
        },
      },
    ),
  ]);

  return {
    available: true,
    hiddenCommentSlugs,
    hiddenGameSlugs,
  };
}

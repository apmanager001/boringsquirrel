"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAuthSession,
  getSessionIdentityFromUnknown,
  auth,
} from "@/lib/auth";
import { getStoredAuthUserById } from "@/lib/auth-users";
import {
  deleteBlogCommentAndReports,
  normalizeAdminBlogCommentReportFilter,
  setBlogCommentReportReadState,
} from "@/lib/blog-comments";
import {
  deleteContactMessage,
  normalizeAdminContactFilter,
  setContactMessageReadState,
} from "@/lib/contact";
import {
  hideReportedUserPublicContent,
  normalizeAdminProfileReportFilter,
  setProfileReportReadState,
} from "@/lib/profile-reports";

const adminLoginHref = `/login?callbackURL=${encodeURIComponent("/admin")}`;

function getAdminMessageRedirectHref(filter: string) {
  return filter === "all"
    ? "/admin?view=messages"
    : `/admin?view=messages&filter=${encodeURIComponent(filter)}`;
}

function getAdminCommentReportRedirectHref(filter: string) {
  return filter === "all"
    ? "/admin?view=reports"
    : `/admin?view=reports&filter=${encodeURIComponent(filter)}`;
}

function getAdminProfileReportRedirectHref(filter: string) {
  return filter === "all"
    ? "/admin?view=profile-reports"
    : `/admin?view=profile-reports&filter=${encodeURIComponent(filter)}`;
}

async function requireAdminIdentity() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(adminLoginHref);
  }

  const identity = getSessionIdentityFromUnknown(session.user);

  if (!identity) {
    redirect(adminLoginHref);
  }

  if (!identity.isAdmin) {
    redirect("/admin");
  }

  return identity;
}

export async function updateContactMessageReadState(formData: FormData) {
  const identity = await requireAdminIdentity();
  const messageId = String(formData.get("messageId") ?? "").trim();
  const nextReadState = String(formData.get("nextReadState") ?? "").trim();
  const filter = normalizeAdminContactFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!messageId || (nextReadState !== "read" && nextReadState !== "unread")) {
    redirect(getAdminMessageRedirectHref(filter));
  }

  await setContactMessageReadState({
    messageId,
    isRead: nextReadState === "read",
    actorUserId: identity.userId,
  });

  revalidatePath("/admin");
  redirect(getAdminMessageRedirectHref(filter));
}

export async function removeContactMessage(formData: FormData) {
  await requireAdminIdentity();
  const messageId = String(formData.get("messageId") ?? "").trim();
  const filter = normalizeAdminContactFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!messageId) {
    redirect(getAdminMessageRedirectHref(filter));
  }

  await deleteContactMessage(messageId);

  revalidatePath("/admin");
  redirect(getAdminMessageRedirectHref(filter));
}

export async function updateBlogCommentReportReadState(formData: FormData) {
  const identity = await requireAdminIdentity();
  const reportId = String(formData.get("reportId") ?? "").trim();
  const nextReadState = String(formData.get("nextReadState") ?? "").trim();
  const filter = normalizeAdminBlogCommentReportFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!reportId || (nextReadState !== "reviewed" && nextReadState !== "open")) {
    redirect(getAdminCommentReportRedirectHref(filter));
  }

  await setBlogCommentReportReadState({
    reportId,
    isRead: nextReadState === "reviewed",
    actorUserId: identity.userId,
  });

  revalidatePath("/admin");
  redirect(getAdminCommentReportRedirectHref(filter));
}

export async function removeReportedBlogComment(formData: FormData) {
  await requireAdminIdentity();
  const commentId = String(formData.get("commentId") ?? "").trim();
  const commentSlug = String(formData.get("commentSlug") ?? "").trim();
  const filter = normalizeAdminBlogCommentReportFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!commentId) {
    redirect(getAdminCommentReportRedirectHref(filter));
  }

  await deleteBlogCommentAndReports(commentId);

  revalidatePath("/admin");

  if (commentSlug) {
    revalidatePath(`/blog/${commentSlug}`);
  }

  redirect(getAdminCommentReportRedirectHref(filter));
}

export async function updateProfileReportReadState(formData: FormData) {
  const identity = await requireAdminIdentity();
  const reportId = String(formData.get("reportId") ?? "").trim();
  const nextReadState = String(formData.get("nextReadState") ?? "").trim();
  const filter = normalizeAdminProfileReportFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!reportId || (nextReadState !== "reviewed" && nextReadState !== "open")) {
    redirect(getAdminProfileReportRedirectHref(filter));
  }

  await setProfileReportReadState({
    reportId,
    isRead: nextReadState === "reviewed",
    actorUserId: identity.userId,
  });

  revalidatePath("/admin");
  redirect(getAdminProfileReportRedirectHref(filter));
}

export async function banReportedProfileUser(formData: FormData) {
  const identity = await requireAdminIdentity();
  const reportedUserId = String(formData.get("reportedUserId") ?? "").trim();
  const filter = normalizeAdminProfileReportFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!reportedUserId) {
    redirect(getAdminProfileReportRedirectHref(filter));
  }

  const reportedUser = await getStoredAuthUserById(reportedUserId);

  if (!reportedUser) {
    redirect(getAdminProfileReportRedirectHref(filter));
  }

  if (!reportedUser.banned) {
    if (!auth) {
      redirect(getAdminProfileReportRedirectHref(filter));
    }

    await auth.api.banUser({
      headers: await headers(),
      body: {
        userId: reportedUserId,
        banReason: "Profile reported for inappropriate public information.",
      },
    });
  }

  const moderationResult = await hideReportedUserPublicContent({
    userId: reportedUserId,
    actorUserId: identity.userId,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath(`/profile/${reportedUserId}`);

  if (moderationResult.available) {
    for (const gameSlug of moderationResult.hiddenGameSlugs) {
      revalidatePath(`/games/${gameSlug}`);
    }
  }

  redirect(getAdminProfileReportRedirectHref(filter));
}

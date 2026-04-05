"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthSession, getSessionIdentityFromUnknown } from "@/lib/auth";
import {
  deleteContactMessage,
  normalizeAdminContactFilter,
  setContactMessageReadState,
} from "@/lib/contact";

const adminLoginHref = `/login?callbackURL=${encodeURIComponent("/admin")}`;

function getAdminRedirectHref(filter: string) {
  return filter === "all"
    ? "/admin"
    : `/admin?filter=${encodeURIComponent(filter)}`;
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
    redirect(getAdminRedirectHref(filter));
  }

  await setContactMessageReadState({
    messageId,
    isRead: nextReadState === "read",
    actorUserId: identity.userId,
  });

  revalidatePath("/admin");
  redirect(getAdminRedirectHref(filter));
}

export async function removeContactMessage(formData: FormData) {
  await requireAdminIdentity();
  const messageId = String(formData.get("messageId") ?? "").trim();
  const filter = normalizeAdminContactFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!messageId) {
    redirect(getAdminRedirectHref(filter));
  }

  await deleteContactMessage(messageId);

  revalidatePath("/admin");
  redirect(getAdminRedirectHref(filter));
}

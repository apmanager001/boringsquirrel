import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { ContactMessageModel } from "@/lib/models/contact-message";
import { Types } from "mongoose";

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type AdminContactMessageFilter = "all" | "read" | "unread";

export type AdminContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  readByUserId: string | null;
};

type ContactMessageDocument = {
  _id: { toString(): string } | string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead?: boolean | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  readAt?: Date | string | null;
  readByUserId?: string | null;
};

export const ADMIN_CONTACT_INBOX_LIMIT = 200;

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

function mapAdminContactMessage(
  document: ContactMessageDocument,
): AdminContactMessage {
  return {
    id:
      typeof document._id === "string" ? document._id : document._id.toString(),
    name: document.name,
    email: document.email,
    subject: document.subject,
    message: document.message,
    isRead: document.isRead === true,
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

export function normalizeAdminContactFilter(
  value: string | null | undefined,
): AdminContactMessageFilter {
  if (value === "read" || value === "unread") {
    return value;
  }

  return "all";
}

function getContactMessageFilterQuery(filter: AdminContactMessageFilter) {
  if (filter === "read") {
    return { isRead: true };
  }

  if (filter === "unread") {
    return { isRead: { $ne: true } };
  }

  return {};
}

export async function getAdminContactInbox(
  filter: AdminContactMessageFilter = "all",
) {
  const database = await connectToDatabase();

  if (!database) {
    return {
      available: false,
      totalCount: 0,
      unreadCount: 0,
      readCount: 0,
      messages: [] as AdminContactMessage[],
    };
  }

  const query = getContactMessageFilterQuery(filter);
  const sort =
    filter === "read"
      ? ([
          ["readAt", -1],
          ["createdAt", -1],
        ] as [string, 1 | -1][])
      : filter === "unread"
        ? ([["createdAt", -1]] as [string, 1 | -1][])
        : ([
            ["isRead", 1],
            ["createdAt", -1],
          ] as [string, 1 | -1][]);

  const [messageDocuments, totalCount, unreadCount] = await Promise.all([
    ContactMessageModel.find(query)
      .sort(sort)
      .limit(ADMIN_CONTACT_INBOX_LIMIT)
      .lean(),
    ContactMessageModel.countDocuments({}),
    ContactMessageModel.countDocuments({ isRead: { $ne: true } }),
  ]);

  return {
    available: true,
    totalCount,
    unreadCount,
    readCount: Math.max(totalCount - unreadCount, 0),
    messages: (messageDocuments as ContactMessageDocument[]).map(
      mapAdminContactMessage,
    ),
  };
}

export async function setContactMessageReadState({
  messageId,
  isRead,
  actorUserId,
}: {
  messageId: string;
  isRead: boolean;
  actorUserId: string;
}) {
  const database = await connectToDatabase();

  if (!database || !Types.ObjectId.isValid(messageId)) {
    return false;
  }

  const updatedMessage = await ContactMessageModel.findByIdAndUpdate(
    messageId,
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

  return Boolean(updatedMessage);
}

export async function deleteContactMessage(messageId: string) {
  const database = await connectToDatabase();

  if (!database || !Types.ObjectId.isValid(messageId)) {
    return false;
  }

  const deletedMessage =
    await ContactMessageModel.findByIdAndDelete(messageId).lean();

  return Boolean(deletedMessage);
}

export async function submitContactMessage(input: ContactInput) {
  let savedToDatabase = false;
  let mailed = false;

  const database = await connectToDatabase();

  if (database) {
    await ContactMessageModel.create(input);
    savedToDatabase = true;
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 12px;">New contact form message</h1>
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Subject:</strong> ${input.subject}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${input.message}</p>
    </div>
  `;

  const delivery = await sendMail({
    from: env.contactFrom,
    to: env.contactTo,
    replyTo: input.email,
    subject: `New Boring Squirrel contact: ${input.subject}`,
    html: emailHtml,
    text: `${input.name} <${input.email}>\n\n${input.subject}\n\n${input.message}`,
  });

  mailed = Boolean(delivery);

  if (!savedToDatabase && !mailed) {
    throw new Error(
      "Contact is not configured yet. Add MongoDB and Zoho env values first.",
    );
  }

  return {
    savedToDatabase,
    mailed,
  };
}

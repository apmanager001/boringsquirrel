import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { renderResetPasswordEmail } from "@/emails/reset-password";
import { renderVerifyEmail } from "@/emails/verify-email";
import {
  connectMongoClient,
  getMongoClientInstance,
  getMongoDatabase,
} from "@/lib/auth-db";
import {
  env,
  hasBetterAuthConfig,
  hasGoogleAuthConfig,
  hasMailConfig,
} from "@/lib/env";
import { sendMail } from "@/lib/mail";

const authDb = getMongoDatabase();
const authMongoClient = getMongoClientInstance();

type SessionUserLike = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean | null;
  role?: string | null;
  username?: string | null;
  displayUsername?: string | null;
};

export type SessionIdentity = {
  userId: string;
  email: string;
  emailVerified: boolean;
  role: string;
  isAdmin: boolean;
  username: string;
  displayName: string;
};

export function normalizeUserRole(role: string | null | undefined) {
  return typeof role === "string" && role.trim().length > 0 ? role : "user";
}

export function hasAdminRole(role: string | null | undefined) {
  return normalizeUserRole(role)
    .split(",")
    .some((value) => value.trim().toLowerCase() === "admin");
}

export const auth =
  hasBetterAuthConfig() && authDb
    ? betterAuth({
        appName: "Boring Squirrel",
        baseURL: env.betterAuthUrl,
        basePath: "/api/auth",
        secret: env.betterAuthSecret,
        database: mongodbAdapter(authDb, {
          client: authMongoClient ?? undefined,
        }),
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: false,
          revokeSessionsOnPasswordReset: true,
          sendResetPassword: async ({ user, url }) => {
            if (!hasMailConfig()) {
              throw new Error("Password reset email is not configured yet.");
            }

            const payload = renderResetPasswordEmail({
              name: user.name || user.email,
              resetUrl: url,
            });

            const delivery = await sendMail({
              from: env.verifyFrom,
              to: user.email,
              subject: payload.subject,
              html: payload.html,
              text: `Reset your password by visiting ${url}`,
            });

            if (!delivery) {
              throw new Error("Failed to send the password reset email.");
            }
          },
        },
        emailVerification: {
          sendOnSignUp: true,
          sendOnSignIn: false,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }) => {
            if (!hasMailConfig()) {
              throw new Error("Email verification is not configured yet.");
            }

            const payload = renderVerifyEmail({
              name: user.name || user.email,
              verifyUrl: url,
            });

            const delivery = await sendMail({
              from: env.verifyFrom,
              to: user.email,
              subject: payload.subject,
              html: payload.html,
              text: `Verify your email by visiting ${url}`,
            });

            if (!delivery) {
              throw new Error("Failed to send the verification email.");
            }
          },
        },
        plugins: [
          nextCookies(),
          admin({
            defaultRole: "user",
            adminRoles: ["admin"],
          }),
          username({
            minUsernameLength: 3,
            maxUsernameLength: 24,
          }),
        ],
        ...(hasGoogleAuthConfig()
          ? {
              socialProviders: {
                google: {
                  clientId: env.googleClientId!,
                  clientSecret: env.googleClientSecret!,
                },
              },
            }
          : {}),
      })
    : null;

export async function ensureAuthReady() {
  if (!auth) {
    return false;
  }

  await connectMongoClient();
  return true;
}

export function getSessionIdentity(user: SessionUserLike): SessionIdentity {
  const fallbackUsername = user.email.split("@")[0] || "player";
  const role = normalizeUserRole(user.role);
  const username =
    typeof user.username === "string" && user.username.length > 0
      ? user.username
      : fallbackUsername;
  const displayName =
    typeof user.displayUsername === "string" && user.displayUsername.length > 0
      ? user.displayUsername
      : user.name || username;

  return {
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerified === true,
    role,
    isAdmin: hasAdminRole(role),
    username,
    displayName,
  };
}

export function getSessionIdentityFromUnknown(user: unknown) {
  if (!user || typeof user !== "object") {
    return null;
  }

  if (!("id" in user) || !("email" in user)) {
    return null;
  }

  if (typeof user.id !== "string" || typeof user.email !== "string") {
    return null;
  }

  return getSessionIdentity(user as SessionUserLike);
}

export async function getAuthSessionFromHeaders(requestHeaders: HeadersInit) {
  if (!auth) {
    return null;
  }

  await connectMongoClient();

  return auth.api.getSession({
    headers: requestHeaders,
  });
}

export async function getAuthSession() {
  if (!auth) {
    return null;
  }

  return getAuthSessionFromHeaders(await headers());
}

export async function getRegisteredUserCount() {
  if (!hasBetterAuthConfig()) {
    return 0;
  }

  await connectMongoClient();

  const database = getMongoDatabase();

  if (!database) {
    return 0;
  }

  return database.collection("user").countDocuments({});
}

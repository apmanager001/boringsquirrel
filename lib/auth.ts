import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
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
  username?: string | null;
  displayUsername?: string | null;
};

export type SessionIdentity = {
  userId: string;
  email: string;
  emailVerified: boolean;
  username: string;
  displayName: string;
};

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
          requireEmailVerification: true,
        },
        emailVerification: {
          sendOnSignUp: true,
          sendOnSignIn: true,
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

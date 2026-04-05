export const env = {
  siteUrl:
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://boringsquirrel.com",
  defaultAuthor: process.env.SITE_DEFAULT_AUTHOR ?? "admin",
  gaId: process.env.NEXT_PUBLIC_GA_ID,
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
  mongoUri: process.env.MONGODB_URI,
  zohoHost: process.env.ZOHO_SMTP_HOST ?? "smtp.zoho.com",
  zohoPort: Number(process.env.ZOHO_SMTP_PORT ?? 465),
  zohoUser:
    process.env.ZOHO_SMTP_USER ??
    process.env.MAIL_VERIFY_FROM ??
    "verify@boringsquirrel.com",
  zohoAppPassword: process.env.ZOHO_SMTP_APP_PASSWORD,
  verifyFrom: process.env.MAIL_VERIFY_FROM ?? "verify@boringsquirrel.com",
  contactFrom: process.env.MAIL_CONTACT_FROM ?? "contact@boringsquirrel.com",
  contactTo: process.env.MAIL_CONTACT_TO ?? "contact@boringsquirrel.com",
  newsletterFrom:
    process.env.MAIL_NEWSLETTER_FROM ?? "contact@boringsquirrel.com",
  betterAuthSecret: process.env.BETTER_AUTH_SECRET,
  betterAuthUrl:
    process.env.BETTER_AUTH_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  socialXUrl: process.env.SOCIAL_X_URL,
  socialGithubUrl: process.env.SOCIAL_GITHUB_URL,
  socialBlueskyUrl: process.env.SOCIAL_BLUESKY_URL,
};

export function hasMongoConfig() {
  return Boolean(env.mongoUri);
}

export function hasMailConfig() {
  return Boolean(env.zohoUser && env.zohoAppPassword);
}

export function hasBetterAuthConfig() {
  return Boolean(env.mongoUri && env.betterAuthSecret && env.betterAuthUrl);
}

export function hasGoogleAuthConfig() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}

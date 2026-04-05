import { renderEmailFrame } from "@/emails/_shared";

type VerifyEmailOptions = {
  name: string;
  verifyUrl: string;
};

export function renderVerifyEmail({ name, verifyUrl }: VerifyEmailOptions) {
  return {
    subject: "Verify your Boring Squirrel email",
    html: renderEmailFrame({
      eyebrow: "Verify email",
      title: `Verify your email, ${name}`,
      body: `<p>Email verification is required before you can like blog posts or save leaderboard scores.</p><p>Use the button below to finish activating your account.</p>`,
      ctaLabel: "Verify email",
      ctaHref: verifyUrl,
    }),
  };
}

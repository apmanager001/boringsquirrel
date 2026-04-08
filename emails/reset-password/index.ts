import { renderEmailFrame } from "@/emails/_shared";

type ResetPasswordEmailOptions = {
  name: string;
  resetUrl: string;
};

export function renderResetPasswordEmail({
  name,
  resetUrl,
}: ResetPasswordEmailOptions) {
  return {
    subject: "Reset your Boring Squirrel password",
    html: renderEmailFrame({
      eyebrow: "Password reset",
      title: `Reset your password, ${name}`,
      body: `<p>We received a request to reset your Boring Squirrel password.</p><p>This link expires in 1 hour. If you did not request it, you can ignore this email.</p>`,
      ctaLabel: "Reset password",
      ctaHref: resetUrl,
    }),
  };
}

import { renderEmailFrame } from "@/emails/_shared";

type WelcomeEmailOptions = {
  name: string;
};

export function renderWelcomeEmail({ name }: WelcomeEmailOptions) {
  return {
    subject: "Welcome to Boring Squirrel",
    html: renderEmailFrame({
      eyebrow: "Welcome",
      title: `Hey ${name}, you’re in.`,
      body: `<p>Thanks for joining Boring Squirrel.</p><p>As the site grows, your account will unlock saved scores, blog likes, profile tools, and player settings.</p>`,
      ctaLabel: "Visit the site",
      ctaHref: "https://boringsquirrel.com",
    }),
  };
}

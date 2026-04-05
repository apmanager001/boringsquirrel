import { renderEmailFrame } from "@/emails/_shared";

type NewPostEmailOptions = {
  title: string;
  description: string;
  href: string;
};

export function renderNewPostEmail({
  title,
  description,
  href,
}: NewPostEmailOptions) {
  return {
    subject: `New post: ${title}`,
    html: renderEmailFrame({
      eyebrow: "New blog post",
      title,
      body: `<p>${description}</p><p>You’re receiving this because new-post emails are enabled in your settings.</p>`,
      ctaLabel: "Read the post",
      ctaHref: href,
    }),
  };
}

type EmailFrameInput = {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function renderEmailFrame({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
}: EmailFrameInput) {
  return `
    <div style="margin:0;padding:32px;background:#f3f8ed;font-family:Arial,sans-serif;color:#0a070e;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(44,59,35,0.12);">
        <div style="padding:20px 28px;background:#24311e;color:#f1f6ea;letter-spacing:0.24em;font-size:12px;font-weight:700;text-transform:uppercase;">
          ${eyebrow}
        </div>
        <div style="padding:32px 28px;line-height:1.7;">
          <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;">${title}</h1>
          <div style="font-size:16px;color:#22301d;">${body}</div>
          ${
            ctaLabel && ctaHref
              ? `<p style="margin-top:24px;"><a href="${ctaHref}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#b75c1f;color:#fff6ee;text-decoration:none;font-weight:700;">${ctaLabel}</a></p>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

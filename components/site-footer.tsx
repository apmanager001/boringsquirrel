import Image from "next/image";
import Link from "next/link";
import { Mail, Rss } from "lucide-react";
import { footerLinks, getSocialLinks, siteConfig } from "@/lib/site";

export function SiteFooter() {
  const socialLinks = getSocialLinks();

  return (
    <footer className="mt-20 hidden border-t border-base-300/20 bg-neutral text-neutral-content lg:block">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative block size-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image
                src={siteConfig.logoPath}
                alt={`${siteConfig.name} logo`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </span>
            <div>
              <p className="display-font text-2xl font-semibold">
                {siteConfig.name}
              </p>
              <p className="text-sm text-neutral-content/70">
                Games and stories with teeth.
              </p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-7 text-neutral-content/80">
            A home for browser games, build notes, puzzle experiments, and
            content designed to rank cleanly.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-neutral-content/75">
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="glass-strip inline-flex items-center gap-2 rounded-full px-3 py-2 hover:text-neutral-content"
            >
              <Mail className="size-4" />
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-content/65">
            Explore
          </p>
          <div className="grid gap-3 text-sm">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-fit text-neutral-content/80 hover:text-neutral-content"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-content/65">
            Social
          </p>
          {socialLinks.length > 0 && (
            <div className="grid gap-3 text-sm">
              {socialLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit text-neutral-content/80 hover:text-neutral-content"
                >
                  <Image
                    src={item.icon}
                    alt={`${item.label} icon`}
                    width={16}
                    height={16}
                  />
                </a>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-3 text-sm text-neutral-content/75">
            <Link
              href="/rss.xml"
              target='_blank'
              type="application/rss+xml"
              aria-label="RSS feed for all blog posts"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 hover:text-neutral-content"
            >
              <Rss className="size-4" />
              All Blog Posts
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 py-4 text-sm text-neutral-content/60">
        <div className="page-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

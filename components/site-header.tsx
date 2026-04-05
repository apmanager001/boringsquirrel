import Image from "next/image";
import Link from "next/link";
import { NotebookText } from "lucide-react";
import { SessionCta } from "@/components/auth/session-cta";
import { hasBetterAuthConfig } from "@/lib/env";
import { primaryNav, siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-base-300/20 bg-base-100/70 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="relative block size-12 overflow-hidden rounded-2xl border border-base-300/30 bg-white/60 shadow-lg shadow-base-300/20">
            <Image
              src={siteConfig.logoPath}
              alt={`${siteConfig.name} logo`}
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="display-font block truncate text-xl font-bold text-base-content">
              {siteConfig.name}
            </span>
            <span className="block truncate text-sm text-base-content/70">
              Playful games. Gaming Posts.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-base-content/80 hover:bg-white/45 hover:text-base-content"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/blog/recent"
            className="btn btn-ghost hidden rounded-full border border-base-300/25 bg-white/35 sm:inline-flex"
          >
            <NotebookText className="size-4" />
            Latest Posts
          </Link>
          <SessionCta authEnabled={hasBetterAuthConfig()} />
        </div>
      </div>

      <div className="page-shell pb-4 lg:hidden">
        <nav className="flex gap-2 overflow-x-auto">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-base-300/20 bg-white/40 px-4 py-2 text-sm font-medium text-base-content/85"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

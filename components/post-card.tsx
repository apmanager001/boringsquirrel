import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Heart, Timer } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog";
import { formatDate, siteConfig } from "@/lib/site";

type PostCardProps = {
  post: BlogPostSummary;
};

export function PostCard({ post }: PostCardProps) {
  const heroImage = post.resolvedHeroImage ?? siteConfig.ogImage;

  return (
    <article className="card-surface group flex h-full flex-col overflow-hidden rounded-[1.75rem]">
      <Link href={post.canonicalPath} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] overflow-hidden border-b border-base-300/15 bg-base-200/15">
          <Image
            src={heroImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="eager"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-linear-to-t from-black/55 to-transparent px-5 py-4 text-white">
            <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Heart className="size-4" />
              {post.likeCount}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/60">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-3.5" />
              {post.readingTime} min read
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="display-font text-2xl font-semibold leading-tight text-base-content">
              {post.title}
            </h3>
            <p className="text-sm leading-7 text-base-content/78">
              {post.description}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full badge badge-accent badge-sm font-medium text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}

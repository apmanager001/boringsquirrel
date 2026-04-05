import Link from "next/link";
import { PostCard } from "@/components/post-card";
import {
  getAllBlogPosts,
  getBlogArchivePath,
  getBlogCategoryPath,
  getBlogCategorySummaries,
  getPopularPosts,
} from "@/lib/blog";
import { buildMetadata } from "@/lib/site";
import { ArrowUpRight, Clock3, Flame, Nut } from "lucide-react";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Read the most popular and most recent posts from Boring Squirrel, all driven by MDX frontmatter and clean metadata.",
  path: "/blog",
  keywords: [
    "game development blog",
    "seo blog",
    "mdx blog",
    "nextjs app router blog",
  ],
});

export default async function BlogPage() {
  const [posts, popularPosts, categories] = await Promise.all([
    getAllBlogPosts(),
    getPopularPosts(3),
    getBlogCategorySummaries(),
  ]);

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-6">
          <p className="section-kicker">
            <Nut />
            The Nut Blog
          </p>
          <div className="space-y-4">
            <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
              Latest & Greatest from Our Stash
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-base-content/80">
              Browse the newest posts alongside the ones readers love most.
              Updated regularly with fresh writing, guides, and ideas.
            </p>
          </div>
        </div>
        <div className="space-y-4 lg:sticky lg:top-28">
          <aside className="card-surface rounded-[1.6rem] p-6">
            <p className="section-kicker before:w-6">Categories</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={getBlogCategoryPath(category.name)}
                  className="badge badge-primary hover:badge-secondary font-medium text-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              <Link
                href={getBlogArchivePath("popular")}
                className="group flex items-center justify-between gap-4 rounded-[1.35rem] border border-base-300/20 bg-white/35 px-4 py-4 transition hover:-translate-y-0.5 hover:border-base-300/35 hover:bg-white/55"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex rounded-full bg-primary/14 p-2 text-primary">
                    <Flame className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-base-content">
                      Popular archive
                    </p>
                    <p className="mt-1 text-xs leading-5 text-base-content/65">
                      See every post sorted by likes and momentum.
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-base-content/45 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-base-content" />
              </Link>
              <Link
                href={getBlogArchivePath("recent")}
                className="group flex items-center justify-between gap-4 rounded-[1.35rem] border border-base-300/20 bg-white/35 px-4 py-4 transition hover:-translate-y-0.5 hover:border-base-300/35 hover:bg-white/55"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex rounded-full bg-secondary/16 p-2 text-secondary">
                    <Clock3 className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-base-content">
                      Recent archive
                    </p>
                    <p className="mt-1 text-xs leading-5 text-base-content/65">
                      Browse the full timeline from newest to oldest.
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-base-content/45 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-base-content" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link
              href={getBlogArchivePath("popular")}
              className="section-kicker before:w-6"
            >
              Most popular
            </Link>
            <h2 className="display-font text-4xl font-semibold">
              The posts people liked most
            </h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {popularPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="mt-16 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link
              href={getBlogArchivePath("recent")}
              className="section-kicker before:w-6"
            >
              Most recent
            </Link>
            <h2 className="display-font text-4xl font-semibold">
              Everything published so far
            </h2>
          </div>
          <Link
            href="/contact"
            className="text-sm font-semibold text-base-content/70 hover:text-base-content"
          >
            Need a custom topic? Contact the site.
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

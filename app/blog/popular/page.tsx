import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArchivePagination } from "@/components/blog/archive-pagination";
import { PostCard } from "@/components/post-card";
import {
  buildBlogPagePath,
  getBlogArchivePath,
  getPopularPostsPage,
  parseBlogPageParam,
} from "@/lib/blog";
import { buildMetadata } from "@/lib/site";

type PopularPostsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
  searchParams,
}: PopularPostsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parseBlogPageParam(params.page);
  const currentPage = page ?? 1;

  return buildMetadata({
    title:
      currentPage > 1
        ? `Popular Blog Posts - Page ${currentPage}`
        : "Popular Blog Posts",
    description:
      "Browse the Boring Squirrel posts with the most likes and strongest reader interest.",
    path: buildBlogPagePath(getBlogArchivePath("popular"), currentPage),
    keywords: [
      "popular blog posts",
      "most liked posts",
      "boring squirrel blog",
    ],
    noIndex: page === null,
  });
}

export default async function PopularPostsPage({
  searchParams,
}: PopularPostsPageProps) {
  const params = await searchParams;
  const page = parseBlogPageParam(params.page);

  if (page === null) {
    notFound();
  }

  const pageData = await getPopularPostsPage(page);

  if (!pageData) {
    notFound();
  }

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-4">
        <Link href="/blog" className="section-kicker before:w-6">
          Back to Blog
        </Link>
        <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
          Popular Posts
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-base-content/80">
          A full archive of the posts readers have liked most, ordered by
          engagement and then by recency.
        </p>
      </section>

      <section className="mt-12 space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {pageData.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        <ArchivePagination
          basePath={getBlogArchivePath("popular")}
          currentPage={pageData.currentPage}
          totalPages={pageData.totalPages}
          totalPosts={pageData.totalPosts}
          pageSize={pageData.pageSize}
        />
      </section>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArchivePagination } from "@/components/blog/archive-pagination";
import { PostCard } from "@/components/post-card";
import {
  buildBlogPagePath,
  getBlogCategoryBySlug,
  getBlogCategoryPath,
  getBlogCategorySummaries,
  getCategoryPostsPage,
  parseBlogPageParam,
} from "@/lib/blog";
import { buildMetadata } from "@/lib/site";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getBlogCategorySummaries();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const category = await getBlogCategoryBySlug(slug);
  const page = parseBlogPageParam(rawSearchParams.page);
  const currentPage = page ?? 1;

  if (!category) {
    return buildMetadata({
      title: "Category not found",
      path: `/blog/category/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title:
      currentPage > 1
        ? `${category.name} Posts - Page ${currentPage}`
        : `${category.name} Posts`,
    description: `Browse all Boring Squirrel posts filed under ${category.name}.`,
    path: buildBlogPagePath(getBlogCategoryPath(category.name), currentPage),
    keywords: [
      category.name,
      `${category.name} blog posts`,
      "boring squirrel blog",
    ],
    noIndex: page === null,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const page = parseBlogPageParam(rawSearchParams.page);

  if (page === null) {
    notFound();
  }

  const [categoryPage, categories] = await Promise.all([
    getCategoryPostsPage(slug, page),
    getBlogCategorySummaries(),
  ]);

  if (!categoryPage) {
    notFound();
  }

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-4">
        <Link href="/blog" className="section-kicker before:w-6">
          Back to Blog
        </Link>
        <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
          {categoryPage.category.name} Posts
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-base-content/80">
          Everything filed under {categoryPage.category.name}, gathered into one
          paginated archive.
        </p>
      </section>

      <section className="mt-10 space-y-5">
        <p className="section-kicker before:w-6">Browse categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = category.slug === categoryPage.category.slug;

            return (
              <Link
                key={category.slug}
                href={getBlogCategoryPath(category.name)}
                className={
                  isActive
                    ? "rounded-full border border-base-content/20 bg-base-content px-3 py-1 text-sm font-medium text-base-100"
                    : "rounded-full border border-base-300/20 bg-white/35 px-3 py-1 text-sm font-medium text-base-content/75 hover:bg-white/55"
                }
              >
                {category.name} ({category.postCount})
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {categoryPage.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        <ArchivePagination
          basePath={getBlogCategoryPath(categoryPage.category.name)}
          currentPage={categoryPage.currentPage}
          totalPages={categoryPage.totalPages}
          totalPosts={categoryPage.totalPosts}
          pageSize={categoryPage.pageSize}
        />
      </section>
    </main>
  );
}

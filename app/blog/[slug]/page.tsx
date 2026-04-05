import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostReactionRail } from "@/components/blog/post-reaction-rail";
import { PostViewTracker } from "@/components/blog/post-view-tracker";
import {
  getBlogCategories,
  getBlogCategoryPath,
  getBlogPostBySlug,
  getBlogSlugs,
  getPopularPosts,
  loadPostComponent,
} from "@/lib/blog";
import { buildMetadata, formatDate, siteConfig } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return buildMetadata({
      title: "Post not found",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: post.canonicalPath,
    image: post.resolvedHeroImage ?? siteConfig.ogImage,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated,
    tags: post.tags,
    keywords: [...post.tags, post.category, "boring squirrel blog"],
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, PostBody] = await Promise.all([
    getBlogPostBySlug(slug),
    loadPostComponent(slug),
  ]);

  if (!post || !PostBody) {
    notFound();
  }

  const [popularPosts, categories] = await Promise.all([
    getPopularPosts(4),
    getBlogCategories(),
  ]);
  const sidebarPopularPosts = popularPosts
    .filter((popularPost) => popularPost.slug !== post.slug)
    .slice(0, 3);

  const heroImage = post.resolvedHeroImage ?? siteConfig.ogImage;

  return (
    <main className="page-shell py-14 sm:py-20">
      <PostViewTracker slug={slug} />

      <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-8">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">
              <Link href={getBlogCategoryPath(post.category)}>
                {post.category}
              </Link>
              <span>{formatDate(post.date)}</span>
              <span className="badge badge-sm badge-accent">
                {post.readingTime} min read
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                {post.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {post.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-accent badge-sm font-medium text-primary-content"
                >
                  {tag}
                </span>
              ))}
              <span></span>
            </div>
          </header>

          {/* <div className="card-surface overflow-hidden rounded-[2rem] p-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.4rem]">
              <Image
                src={heroImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
              />
            </div>
          </div> */}

          <div className="prose-squirrel card-surface rounded-4xl px-6 py-8 sm:px-8 sm:py-10">
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <Image
                src={heroImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority
              />
            </div>
            <PostBody />
            {post.source.length > 0 && (
              <div className="mt-10 border-t border-base-300/20 pt-6">
                <div className="flex flex-col space-y--2 w-fit">
                  <span className="text-xs font-medium text-base-content/60">
                    Sources:
                  </span>
                  {post.source.map((source, index) => (
                    <Link
                      key={index}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium w-full link-unstyled"
                    >
                      <span className="text-base-content/80 hover:text-base-content transition">
                        {source}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-28">
          <aside className="card-surface rounded-[1.6rem] p-5 text-sm leading-7 text-base-content/78">
            <p className="section-kicker before:w-6">Post Info</p>
            <PostReactionRail
              slug={post.slug}
              initialLikeCount={post.likeCount}
            />
            <div className="mt-4 flex justify-between items-center">
              <p className="text-xs font-medium">Author: </p>
              <span className=" font-extrabold">{post.author}</span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs font-medium">Published: </p>
              <span className=" font-extrabold">{formatDate(post.date)}</span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs font-medium">Updated: </p>
              <span className=" font-extrabold">
                {formatDate(post.updated)}
              </span>
            </div>
          </aside>
          <aside className="card-surface rounded-[1.6rem] p-5 text-sm leading-7 text-base-content/78">
            <p className="section-kicker before:w-6">Popular Posts</p>
            <div className="mt-5 space-y-3">
              {sidebarPopularPosts.length === 0 ? (
                <p className="text-base-content/60">No other posts yet.</p>
              ) : (
                sidebarPopularPosts.map((popularPost) => (
                  <Link
                    key={popularPost.slug}
                    href={popularPost.canonicalPath}
                    className="block rounded-2xl border border-base-300/20 bg-white/30 px-4 py-3 font-medium text-base-content/85 transition hover:bg-white/50 hover:text-base-content"
                  >
                    {popularPost.title}
                  </Link>
                ))
              )}
            </div>
          </aside>
          <aside className="card-surface rounded-[1.6rem] p-6 lg:sticky lg:top-28">
            <p className="section-kicker before:w-6">Find Posts By Category</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={getBlogCategoryPath(category)}
                  className="badge badge-primary hover:badge-secondary font-medium text-white"
                >
                  {category}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}

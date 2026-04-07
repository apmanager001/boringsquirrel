import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { BlogMetricModel } from "@/lib/models/blog-metric";

type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  updated: string;
  tags: string[];
  source: string[];
  category: string;
  heroImage?: string;
  draft: boolean;
  readingTime: number;
  author?: string;
};

export type BlogPostSummary = BlogFrontmatter & {
  slug: string;
  author: string;
  excerpt: string;
  likeCount: number;
  viewCount: number;
  canonicalPath: string;
  resolvedHeroImage: string | null;
};

export type BlogCategorySummary = {
  name: string;
  slug: string;
  postCount: number;
};

export type PaginatedBlogPosts = {
  posts: BlogPostSummary[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  pageSize: number;
};

export const BLOG_PAGE_SIZE = 9;

const BLOG_ROOT = path.join(process.cwd(), "app", "blog");

function shouldShowDrafts() {
  return process.env.NODE_ENV !== "production";
}

function sortPostsByPopularity(posts: BlogPostSummary[]) {
  return [...posts].sort((left, right) => {
    if (right.likeCount !== left.likeCount) {
      return right.likeCount - left.likeCount;
    }

    return new Date(right.date).getTime() - new Date(left.date).getTime();
  });
}

function paginatePosts(
  posts: BlogPostSummary[],
  page: number,
  pageSize: number,
): PaginatedBlogPosts | null {
  if (!Number.isInteger(page) || page < 1) {
    return null;
  }

  const totalPosts = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  if (page > totalPages) {
    return null;
  }

  const startIndex = (page - 1) * pageSize;

  return {
    posts: posts.slice(startIndex, startIndex + pageSize),
    currentPage: page,
    totalPages,
    totalPosts,
    pageSize,
  };
}

async function getPostsByCategory(categoryName: string) {
  const posts = await getCachedPosts();
  return posts.filter((post) => post.category === categoryName);
}

export function getBlogArchivePath(view: "popular" | "recent") {
  return `/blog/${view}`;
}

export function getBlogCategorySlug(categoryName: string) {
  return categoryName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getBlogCategoryPath(categoryName: string) {
  return `/blog/category/${getBlogCategorySlug(categoryName)}`;
}

export function buildBlogPagePath(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function parseBlogPageParam(pageParam: string | string[] | undefined) {
  const value = Array.isArray(pageParam) ? pageParam[0] : pageParam;

  if (!value) {
    return 1;
  }

  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return null;
  }

  return page;
}

function getPostPath(slug: string) {
  return path.join(BLOG_ROOT, slug, "post.mdx");
}

function extractExcerpt(content: string) {
  const flattened = content
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`\-\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return flattened.length > 170
    ? `${flattened.slice(0, 167).trimEnd()}...`
    : flattened;
}

function resolveHeroImage(heroImage?: string) {
  if (!heroImage) {
    return null;
  }

  if (heroImage.startsWith("/") || heroImage.startsWith("http")) {
    return heroImage;
  }

  return null;
}

function assertFrontmatter(
  slug: string,
  data: Record<string, unknown>,
): BlogFrontmatter {
  const requiredFields = [
    "title",
    "description",
    "date",
    "updated",
    "category",
    "readingTime",
    "draft",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined) {
      throw new Error(`Missing \`${field}\` in ${slug}/post.mdx`);
    }
  }

  return {
    title: String(data.title),
    description: String(data.description),
    date: String(data.date),
    updated: String(data.updated),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    source: Array.isArray(data.source) ? data.source.map(String) : [],
    category: String(data.category),
    heroImage: data.heroImage ? String(data.heroImage) : undefined,
    draft: Boolean(data.draft),
    readingTime: Number(data.readingTime),
    author: data.author ? String(data.author) : undefined,
  };
}

function getPostSlugsInternal() {
  return fs
    .readdirSync(BLOG_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("["))
    .map((entry) => entry.name)
    .filter((slug) => fs.existsSync(getPostPath(slug)));
}

async function getMetricMap(slugs: string[]) {
  const database = await connectToDatabase();

  if (!database || slugs.length === 0) {
    return new Map<string, { likeCount: number; viewCount: number }>();
  }

  const metrics = (await BlogMetricModel.find({ slug: { $in: slugs } })
    .select({ slug: 1, likeCount: 1, viewCount: 1, _id: 0 })
    .lean()) as Array<{ slug: string; likeCount?: number; viewCount?: number }>;

  return new Map(
    metrics.map((metric) => [
      metric.slug,
      {
        likeCount: metric.likeCount ?? 0,
        viewCount: metric.viewCount ?? 0,
      },
    ]),
  );
}

const getCachedPostsWithDrafts = cache(async (): Promise<BlogPostSummary[]> => {
  const slugs = getPostSlugsInternal();
  const metricMap = await getMetricMap(slugs);

  const posts = slugs.map((slug) => {
    const source = fs.readFileSync(getPostPath(slug), "utf8");
    const { data, content } = matter(source);
    const frontmatter = assertFrontmatter(
      slug,
      data as Record<string, unknown>,
    );
    const metrics = metricMap.get(slug) ?? { likeCount: 0, viewCount: 0 };

    return {
      ...frontmatter,
      slug,
      author: frontmatter.author ?? env.defaultAuthor,
      excerpt: extractExcerpt(content),
      likeCount: metrics.likeCount,
      viewCount: metrics.viewCount,
      canonicalPath: `/blog/${slug}`,
      resolvedHeroImage: resolveHeroImage(frontmatter.heroImage),
    };
  });

  return posts.sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
});

const getCachedPosts = cache(async (): Promise<BlogPostSummary[]> => {
  const posts = await getCachedPostsWithDrafts();

  if (shouldShowDrafts()) {
    return posts;
  }

  return posts.filter((post) => !post.draft);
});

export function getBlogSlugs() {
  const slugs = getPostSlugsInternal();

  if (shouldShowDrafts()) {
    return slugs;
  }

  return slugs.filter((slug) => {
    const source = fs.readFileSync(getPostPath(slug), "utf8");
    const { data } = matter(source);
    const frontmatter = assertFrontmatter(
      slug,
      data as Record<string, unknown>,
    );

    return !frontmatter.draft;
  });
}

export async function getAllBlogPosts() {
  return getCachedPosts();
}

export async function getAllBlogPostsForAdmin() {
  return getCachedPostsWithDrafts();
}

export async function getRecentPosts(limit = 3) {
  const posts = await getCachedPosts();
  return posts.slice(0, limit);
}

export async function getPopularPosts(limit = 3) {
  const posts = await getCachedPosts();

  return sortPostsByPopularity(posts).slice(0, limit);
}

export async function getRecentPostsPage(
  page: number,
  pageSize = BLOG_PAGE_SIZE,
) {
  const posts = await getCachedPosts();
  return paginatePosts(posts, page, pageSize);
}

export async function getPopularPostsPage(
  page: number,
  pageSize = BLOG_PAGE_SIZE,
) {
  const posts = await getCachedPosts();
  return paginatePosts(sortPostsByPopularity(posts), page, pageSize);
}

export async function getBlogCategorySummaries() {
  const posts = await getCachedPosts();
  const categoryCounts = new Map<string, number>();

  for (const post of posts) {
    categoryCounts.set(
      post.category,
      (categoryCounts.get(post.category) ?? 0) + 1,
    );
  }

  return Array.from(categoryCounts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, postCount]) => ({
      name,
      slug: getBlogCategorySlug(name),
      postCount,
    }));
}

export async function getBlogCategoryBySlug(slug: string) {
  const categories = await getBlogCategorySummaries();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getCategoryPostsPage(
  slug: string,
  page: number,
  pageSize = BLOG_PAGE_SIZE,
) {
  const category = await getBlogCategoryBySlug(slug);

  if (!category) {
    return null;
  }

  const posts = await getPostsByCategory(category.name);
  const paginatedPosts = paginatePosts(posts, page, pageSize);

  if (!paginatedPosts) {
    return null;
  }

  return {
    category,
    ...paginatedPosts,
  };
}

export async function getPostsByCategorySlug(slug: string) {
  const category = await getBlogCategoryBySlug(slug);

  if (!category) {
    return null;
  }

  const posts = await getPostsByCategory(category.name);

  return {
    category,
    posts,
  };
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await getCachedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getBlogCategories() {
  const categories = await getBlogCategorySummaries();
  return categories.map((category) => category.name);
}

export async function loadPostComponent(slug: string) {
  try {
    const mdxModule = await import(`@/app/blog/${slug}/post.mdx`);
    return mdxModule.default;
  } catch {
    return null;
  }
}

export async function incrementBlogViews(slug: string) {
  const database = await connectToDatabase();

  if (!database) {
    return false;
  }

  await BlogMetricModel.findOneAndUpdate(
    { slug },
    {
      $inc: {
        viewCount: 1,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return true;
}

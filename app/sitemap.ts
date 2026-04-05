import type { MetadataRoute } from "next";
import {
  getAllBlogPosts,
  getBlogArchivePath,
  getBlogCategoryPath,
  getBlogCategorySummaries,
} from "@/lib/blog";
import { absoluteUrl, gameCatalog } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    getAllBlogPosts(),
    getBlogCategorySummaries(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl(getBlogArchivePath("popular")),
      lastModified: posts[0]?.updated ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: absoluteUrl(getBlogArchivePath("recent")),
      lastModified: posts[0]?.updated ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: absoluteUrl("/games"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];

  const gameRoutes: MetadataRoute.Sitemap = gameCatalog.map((game) => ({
    url: absoluteUrl(`/games/${game.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.78,
    images: [absoluteUrl(game.heroImage)],
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(post.canonicalPath),
    lastModified: post.updated,
    changeFrequency: "monthly",
    priority: 0.8,
    images: post.resolvedHeroImage
      ? [absoluteUrl(post.resolvedHeroImage)]
      : undefined,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => {
    const categoryPosts = posts.filter(
      (post) => post.category === category.name,
    );

    return {
      url: absoluteUrl(getBlogCategoryPath(category.name)),
      lastModified: categoryPosts[0]?.updated ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.74,
    };
  });

  return [...staticRoutes, ...gameRoutes, ...blogRoutes, ...categoryRoutes];
}

import type { BlogPostSummary } from "@/lib/blog";
import { getAllBlogPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const RSS_PATH = "/rss.xml";

const XML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
} as const;

function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => XML_ESCAPES[character as keyof typeof XML_ESCAPES],
  );
}

function formatRssDate(value: Date | string) {
  return new Date(value).toUTCString();
}

function getLastBuildDate(posts: BlogPostSummary[]) {
  if (posts.length === 0) {
    return new Date();
  }

  return posts.reduce((latest, post) => {
    const updatedAt = new Date(post.updated);
    return updatedAt > latest ? updatedAt : latest;
  }, new Date(posts[0].updated));
}

function renderCategoryNodes(post: BlogPostSummary) {
  const categories = Array.from(new Set([post.category, ...post.tags]));

  return categories
    .map((category) => `\n      <category>${escapeXml(category)}</category>`)
    .join("");
}

function renderItem(post: BlogPostSummary) {
  const url = absoluteUrl(post.canonicalPath);

  return `
		<item>
			<title>${escapeXml(post.title)}</title>
			<link>${escapeXml(url)}</link>
			<guid isPermaLink="true">${escapeXml(url)}</guid>
			<pubDate>${formatRssDate(post.date)}</pubDate>
			<description>${escapeXml(post.description)}</description>${renderCategoryNodes(post)}
		</item>`;
}

export async function generateRssXml() {
  const posts = await getAllBlogPosts();
  const items = posts.map(renderItem).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escapeXml(`${siteConfig.name} Blog`)}</title>
		<link>${escapeXml(absoluteUrl("/blog"))}</link>
		<description>${escapeXml(siteConfig.description)}</description>
		<language>en-us</language>
		<lastBuildDate>${formatRssDate(getLastBuildDate(posts))}</lastBuildDate>
		<atom:link href="${escapeXml(absoluteUrl(RSS_PATH))}" rel="self" type="application/rss+xml" />${items}
	</channel>
</rss>`;
}

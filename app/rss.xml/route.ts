import { generateRssXml } from "@/app/rss";

export const revalidate = 3600;

export async function GET() {
  const xml = await generateRssXml();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

import { NextResponse } from "next/server";
import { getBlogPostBySlug, incrementBlogViews } from "@/lib/blog";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await incrementBlogViews(slug);

  return NextResponse.json({ ok: true });
}

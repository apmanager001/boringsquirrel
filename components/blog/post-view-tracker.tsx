"use client";

import { useEffect } from "react";

type PostViewTrackerProps = {
  slug: string;
};

export function PostViewTracker({ slug }: PostViewTrackerProps) {
  useEffect(() => {
    const controller = new AbortController();

    void fetch(`/api/blog/${slug}/view`, {
      method: "POST",
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {
      // Ignore analytics-style view tracking failures.
    });

    return () => controller.abort();
  }, [slug]);

  return null;
}

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildBlogPagePath } from "@/lib/blog";

type ArchivePaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  pageSize: number;
};

export function ArchivePagination({
  basePath,
  currentPage,
  totalPages,
  totalPosts,
  pageSize,
}: ArchivePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalPosts);

  return (
    <nav
      aria-label="Archive pagination"
      className="card-surface flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-base-content/70">
        Showing {rangeStart}-{rangeEnd} of {totalPosts} posts
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildBlogPagePath(basePath, currentPage - 1)}
            className="btn btn-ghost rounded-full"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        ) : (
          <span className="btn btn-ghost rounded-full opacity-50">
            Previous
          </span>
        )}

        <span className="rounded-full border border-base-300/20 bg-white/35 px-4 py-2 text-sm font-semibold text-base-content/80">
          Page {currentPage} of {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={buildBlogPagePath(basePath, currentPage + 1)}
            className="btn btn-ghost rounded-full"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="btn btn-ghost rounded-full opacity-50">Next</span>
        )}
      </div>
    </nav>
  );
}

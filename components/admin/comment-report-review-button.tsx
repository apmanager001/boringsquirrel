"use client";

import { useFormStatus } from "react-dom";

type CommentReportReviewButtonProps = {
  nextReadState: "reviewed" | "open";
};

export function CommentReportReviewButton({
  nextReadState,
}: CommentReportReviewButtonProps) {
  const { pending } = useFormStatus();
  const idleLabel =
    nextReadState === "reviewed" ? "Mark reviewed" : "Reopen report";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn rounded-full px-5 ${
        nextReadState === "reviewed" ? "btn-primary" : "btn-ghost"
      }`}
    >
      {pending ? "Updating..." : idleLabel}
    </button>
  );
}

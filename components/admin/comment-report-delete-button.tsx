"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type CommentReportDeleteButtonProps = {
  commentExists: boolean;
};

export function CommentReportDeleteButton({
  commentExists,
}: CommentReportDeleteButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const message = commentExists
      ? "Delete this comment and clear all of its reports?"
      : "The comment is already gone. Clear the lingering report entry?";

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className="btn btn-error rounded-full px-5"
    >
      <Trash2 className="size-4" />
      {pending
        ? commentExists
          ? "Deleting..."
          : "Clearing..."
        : commentExists
          ? "Delete comment"
          : "Clear report"}
    </button>
  );
}

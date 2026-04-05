"use client";

import { useFormStatus } from "react-dom";

type ContactMessageReviewButtonProps = {
  nextReadState: "read" | "unread";
};

export function ContactMessageReviewButton({
  nextReadState,
}: ContactMessageReviewButtonProps) {
  const { pending } = useFormStatus();
  const idleLabel = nextReadState === "read" ? "Mark read" : "Mark unread";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn rounded-full px-5 ${
        nextReadState === "read" ? "btn-primary" : "btn-ghost"
      }`}
    >
      {pending ? "Updating..." : idleLabel}
    </button>
  );
}

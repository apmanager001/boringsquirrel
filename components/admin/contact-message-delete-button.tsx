"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ContactMessageDeleteButton() {
  const { pending } = useFormStatus();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm("Delete this message from the admin inbox?")) {
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
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

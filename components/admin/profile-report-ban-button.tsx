"use client";

import { UserX } from "lucide-react";
import { useFormStatus } from "react-dom";

type ProfileReportBanButtonProps = {
  alreadyBanned: boolean;
};

export function ProfileReportBanButton({
  alreadyBanned,
}: ProfileReportBanButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (alreadyBanned) {
      event.preventDefault();
      return;
    }

    if (
      !window.confirm(
        "Ban this user and hide their public profile, scores, and comments?",
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      disabled={pending || alreadyBanned}
      onClick={handleClick}
      className={`btn rounded-full px-5 ${
        alreadyBanned ? "btn-ghost" : "btn-error"
      }`}
    >
      <UserX className="size-4" />
      {pending ? "Banning..." : alreadyBanned ? "Already banned" : "Ban user"}
    </button>
  );
}
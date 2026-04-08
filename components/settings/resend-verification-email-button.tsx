"use client";

import { LoaderCircle, MailWarning } from "lucide-react";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

type ResendVerificationEmailButtonProps = {
  email: string;
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Could not resend the verification email right now.";
}

export function ResendVerificationEmailButton({
  email,
}: ResendVerificationEmailButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleResend() {
    setMessage(null);

    startTransition(async () => {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/settings",
      });

      if (result.error) {
        setMessage(getErrorMessage(result.error));
        return;
      }

      setMessage(`A new verification email was sent to ${email}.`);
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={handleResend}
        disabled={pending}
        className="btn btn-ghost rounded-full border border-base-300/20 bg-white/35"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <MailWarning className="size-4" />
        )}
        {pending ? "Sending email..." : "Resend verification email"}
      </button>

      {message ? (
        <p className="text-sm leading-7 text-base-content/80">{message}</p>
      ) : null}
    </div>
  );
}

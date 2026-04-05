"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

type ProfileSocialHandle = {
  label: string;
  handle: string;
  icon: string;
};

type ProfileSocialHandlesProps = {
  accounts: ProfileSocialHandle[];
};

async function copyTextToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textArea = document.createElement("textarea");

  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.append(textArea);
  textArea.select();

  const copied = document.execCommand("copy");

  textArea.remove();

  return copied;
}

export function ProfileSocialHandles({ accounts }: ProfileSocialHandlesProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedLabel) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedLabel(null);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedLabel]);

  async function handleCopy(label: string, handle: string) {
    try {
      const copied = await copyTextToClipboard(handle);

      if (copied) {
        setCopiedLabel(label);
      }
    } catch {
      setCopiedLabel(null);
    }
  }

  return (
    <div className="mt-5 space-y-3 text-sm leading-7 text-base-content/78">
      {accounts.map((account) => {
        const copied = copiedLabel === account.label;

        return (
          <div
            key={account.label}
            className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-base-300/15 bg-white/45 px-4 py-3"
          >
            <div className="min-w-0 flex items-center gap-3">
              <Image
                src={account.icon}
                alt={account.label}
                width={18}
                height={18}
                className="h-4 w-4 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-base-content">
                  {account.label}
                </p>
                <p className="truncate font-mono text-sm text-base-content/72">
                  {account.handle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(account.label, account.handle)}
              className={`btn btn-sm rounded-full ${
                copied
                  ? "btn-primary"
                  : "border border-base-300/20 bg-base-100/75 text-base-content hover:bg-base-100"
              }`}
              aria-label={`Copy ${account.label} screen name`}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  initialContactFormState,
  sendContactForm,
} from "@/app/contact/actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactForm,
    initialContactFormState,
  );

  return (
    <form action={formAction} className="card-surface rounded-4xl p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Name
          </span>
          <input
            name="name"
            type="text"
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="Your name"
          />
          {state.errors?.name ? (
            <span className="text-sm text-error">{state.errors.name}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-base-content/75">
            Email
          </span>
          <input
            name="email"
            type="email"
            className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
            placeholder="you@example.com"
          />
          {state.errors?.email ? (
            <span className="text-sm text-error">{state.errors.email}</span>
          ) : null}
        </label>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-semibold text-base-content/75">
          Subject
        </span>
        <input
          name="subject"
          type="text"
          className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
          placeholder="What do you want to talk about?"
        />
        {state.errors?.subject ? (
          <span className="text-sm text-error">{state.errors.subject}</span>
        ) : null}
      </label>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-semibold text-base-content/75">
          Message
        </span>
        <textarea
          name="message"
          rows={7}
          className="textarea w-full rounded-[1.4rem] border border-base-300/20 bg-white/60"
          placeholder="Tell me what you need, what you are building, or what you want to see next on the site."
        />
        {state.errors?.message ? (
          <span className="text-sm text-error">{state.errors.message}</span>
        ) : null}
      </label>

      {state.message ? (
        <div
          className={`mt-5 rounded-[1.4rem] px-4 py-3 text-sm leading-7 ${
            state.status === "success"
              ? "bg-success/15 text-success"
              : "bg-error/15 text-error"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm leading-7 text-base-content/70">
          Messages are stored in MongoDB when configured and emailed through
          Zoho when SMTP is active.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary rounded-full px-6"
        >
          <Send className="size-4" />
          {pending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}

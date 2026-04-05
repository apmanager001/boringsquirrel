"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { sendContactForm } from "@/app/contact/actions";

export function ContactForm() {
  const initialState = {
    status: "idle" as const,
    message: "",
  };
  const [state, formAction, pending] = useActionState(
    sendContactForm,
    initialState,
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
            required
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
            required
          />
          {state.errors?.email ? (
            <span className="text-sm text-error">{state.errors.email}</span>
          ) : null}
        </label>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-semibold text-base-content/75">
          Title
        </span>
        <input
          name="subject"
          type="text"
          className="input w-full rounded-2xl border border-base-300/20 bg-white/60"
          placeholder="What do you want to talk about?"
          required
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
          required
          minLength={20}
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

      <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
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

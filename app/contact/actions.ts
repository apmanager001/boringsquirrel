"use server";

import { submitContactMessage } from "@/lib/contact";

type ContactField = "name" | "email" | "subject" | "message";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<ContactField, string>>;
};

export const initialContactFormState: ContactFormState = {
  status: "idle",
  message: "",
};

function getValue(formData: FormData, key: ContactField) {
  return String(formData.get(key) ?? "").trim();
}

export async function sendContactForm(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const payload = {
    name: getValue(formData, "name"),
    email: getValue(formData, "email"),
    subject: getValue(formData, "subject"),
    message: getValue(formData, "message"),
  };

  const errors: Partial<Record<ContactField, string>> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (payload.name.length < 2) {
    errors.name = "Please enter your name.";
  }

  if (!emailPattern.test(payload.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (payload.subject.length < 4) {
    errors.subject = "Please add a short subject.";
  }

  if (payload.message.length < 20) {
    errors.message = "Please add at least a couple of sentences.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      errors,
    };
  }

  try {
    const result = await submitContactMessage(payload);

    return {
      status: "success",
      message: result.mailed
        ? "Your message was sent successfully."
        : "Your message was saved and will be reviewed once email delivery is configured.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while sending your message.",
    };
  }
}

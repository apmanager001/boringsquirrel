import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { ContactMessageModel } from "@/lib/models/contact-message";

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function submitContactMessage(input: ContactInput) {
  let savedToDatabase = false;
  let mailed = false;

  const database = await connectToDatabase();

  if (database) {
    await ContactMessageModel.create(input);
    savedToDatabase = true;
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1 style="font-size: 20px; margin-bottom: 12px;">New contact form message</h1>
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Subject:</strong> ${input.subject}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${input.message}</p>
    </div>
  `;

  const delivery = await sendMail({
    from: env.contactFrom,
    to: env.contactTo,
    replyTo: input.email,
    subject: `New Boring Squirrel contact: ${input.subject}`,
    html: emailHtml,
    text: `${input.name} <${input.email}>\n\n${input.subject}\n\n${input.message}`,
  });

  mailed = Boolean(delivery);

  if (!savedToDatabase && !mailed) {
    throw new Error(
      "Contact is not configured yet. Add MongoDB and Zoho env values first.",
    );
  }

  return {
    savedToDatabase,
    mailed,
  };
}

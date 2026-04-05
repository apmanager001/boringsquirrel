import nodemailer from "nodemailer";
import { env, hasMailConfig } from "@/lib/env";

declare global {
  var __boringSquirrelTransport:
    | nodemailer.Transporter<nodemailer.SentMessageInfo>
    | undefined;
}

function getTransporter() {
  if (!hasMailConfig()) {
    return null;
  }

  global.__boringSquirrelTransport ??= nodemailer.createTransport({
    host: env.zohoHost,
    port: env.zohoPort,
    secure: env.zohoPort === 465,
    auth: {
      user: env.zohoUser,
      pass: env.zohoAppPassword,
    },
  });

  return global.__boringSquirrelTransport;
}

type SendMailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendMail(options: SendMailOptions) {
  const transporter = getTransporter();

  if (!transporter) {
    return null;
  }

  return transporter.sendMail(options);
}

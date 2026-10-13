// Outgoing mail through a Gmail account (GMAIL_USER + a Google "app password" in GMAIL_APP_PASSWORD).
// Gmail allows roughly 500 messages a day; callers rate-limit their own sends.
import nodemailer from "nodemailer";

export class MailNotConfiguredError extends Error {}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) throw new MailNotConfiguredError("GMAIL_USER / GMAIL_APP_PASSWORD are not set.");
  transporter ??= nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return transporter;
}

export async function sendMail(message: { to: string; subject: string; text: string; html: string }) {
  const transport = getTransporter();
  await transport.sendMail({ from: `CalendlyGo <${process.env.GMAIL_USER?.trim()}>`, ...message });
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

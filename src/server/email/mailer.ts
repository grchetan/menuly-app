import nodemailer, { type Transporter } from "nodemailer";
import { renderOtpEmail, type EmailTemplateType } from "./templates";

let transporter: Transporter | null = null;

const OFFICIAL_MENULY_USER = "menulyofficial@gmail.com";

function getTransporter(): Transporter | null {
  if (process.env["NODE_ENV"] === "test" || process.env["VITEST"]) {
    return null;
  }

  const host = process.env["SMTP_HOST"] || "smtp.gmail.com";
  const port = Number(process.env["SMTP_PORT"]) || 465;
  const secure = process.env["SMTP_SECURE"] !== "false";

  // Strictly enforce official Menuly account — override any stale personal email from local or Vercel env
  const envUser = process.env["SMTP_USER"]?.trim().toLowerCase();
  const user = (envUser && !envUser.includes("chetanprajapat")) ? envUser : OFFICIAL_MENULY_USER;

  const pass = process.env["SMTP_PASS"]?.replace(/\s+/g, "");

  if (!pass || pass === "your-16-char-gmail-app-password") {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      pool: true, // Reuse TCP/TLS connections to avoid handshake latency on each email
      maxConnections: 3,
      maxMessages: 100,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env["NODE_ENV"] === "production",
      },
    });
  }

  return transporter;
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  isSimulated?: boolean;
  error?: string;
}

/**
 * Send a branded OTP verification email using Gmail SMTP (menuly@gmail.com)
 */
export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  type: EmailTemplateType = "SIGNUP",
  expiresInMinutes: number = 10
): Promise<SendOtpResult> {
  const mailTransporter = getTransporter();
  const { subject, html, text } = renderOtpEmail({
    otp,
    email: toEmail,
    type,
    expiresInMinutes,
  });

  const rawFrom = process.env["SMTP_FROM_EMAIL"]?.trim().toLowerCase();
  const fromEmail = (rawFrom && !rawFrom.includes("chetanprajapat")) ? rawFrom : OFFICIAL_MENULY_USER;
  const fromName = "Menuly";
  const fromHeader = `"${fromName}" <${fromEmail}>`;

  // If no SMTP App Password is configured yet, safely simulate in console for seamless dev/testing
  if (!mailTransporter) {
    console.log("\n" + "=".repeat(64));
    console.log("📨 [MENULY CUSTOM OTP EMAIL — LOCAL DEV / DEMO]");
    console.log(`To:        ${toEmail}`);
    console.log(`Subject:   ${subject}`);
    console.log(`Type:      ${type}`);
    console.log(`🔑 OTP:    >>> ${otp} <<<`);
    console.log(`Expires:   In ${expiresInMinutes} minutes`);
    console.log("ℹ️ Note:    Set SMTP_PASS in .env with your Gmail App Password to send live emails.");
    console.log("=".repeat(64) + "\n");

    return {
      success: true,
      isSimulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: fromHeader,
      to: toEmail,
      subject,
      html,
      text,
    });

    return {
      success: true,
      messageId: info.messageId,
      isSimulated: false,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SMTP Error] Failed to send email to ${toEmail}:`, message);

    // Fallback log to console so developer isn't locked out if credentials are misconfigured
    console.log(`[FALLBACK OTP FOR ${toEmail}]: ${otp}`);

    return {
      success: false,
      error: message,
    };
  }
}

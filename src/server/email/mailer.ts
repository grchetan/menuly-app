import nodemailer, { type Transporter } from "nodemailer";
import fs from "node:fs";
import path from "node:path";
import { renderOtpEmail, type EmailTemplateType } from "./templates";

let transporter: Transporter | null = null;
let cachedLogoBuffer: Buffer | null = null;
let cachedMascotBuffer: Buffer | null = null;

function getTransporter(): Transporter | null {
  const host = process.env["SMTP_HOST"] || "smtp.gmail.com";
  const port = Number(process.env["SMTP_PORT"]) || 465;
  const secure = process.env["SMTP_SECURE"] !== "false";
  const user = process.env["SMTP_USER"] || "menulyofficial@gmail.com";
  const pass = process.env["SMTP_PASS"];

  if (!pass || pass.trim() === "" || pass === "your-16-char-gmail-app-password" || process.env["NODE_ENV"] === "test" || process.env["VITEST"]) {
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
      auth: { user, pass: pass.replace(/\s+/g, "") },
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

  const rawFromName = process.env["SMTP_FROM_NAME"];
  const fromName = rawFromName && !rawFromName.includes("Pure Veg") ? rawFromName : "Menuly";
  const fromEmail = process.env["SMTP_FROM_EMAIL"] || process.env["SMTP_USER"] || "menulyofficial@gmail.com";
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
    // 1. Resolve Logo Buffer (checking public and src assets for user's official badge)
    let logoBuffer = cachedLogoBuffer;
    if (!logoBuffer) {
      const logoPaths = [
        path.resolve(process.cwd(), "public", "assets", "menuly-badge.png"),
        path.resolve(process.cwd(), "src", "assets", "Menuly Digital QR Menu Badge.png"),
        path.resolve(process.cwd(), "public", "assets", "menuly-logo.png"),
        path.resolve(process.cwd(), "public", "assets", "menuly-logo.jpg"),
      ];
      for (const p of logoPaths) {
        if (fs.existsSync(p)) {
          try {
            logoBuffer = fs.readFileSync(p);
            cachedLogoBuffer = logoBuffer;
            break;
          } catch {}
        }
      }
    }

    // 2. Resolve Mascot Banner Buffer (checking public and src assets)
    let mascotBuffer = cachedMascotBuffer;
    if (!mascotBuffer) {
      const mascotPaths = [
        path.resolve(process.cwd(), "public", "assets", "menuly-banner.png"),
        path.resolve(process.cwd(), "src", "assets", "Menuly QR Menu Banner.png"),
        path.resolve(process.cwd(), "public", "assets", "menuly-mascot-banner.png"),
      ];
      for (const p of mascotPaths) {
        if (fs.existsSync(p)) {
          try {
            mascotBuffer = fs.readFileSync(p);
            cachedMascotBuffer = mascotBuffer;
            break;
          } catch {}
        }
      }
    }

    // RFC 2392 / RFC 2111 compliant inline CID attachments for flawless Gmail / Outlook mobile rendering
    const attachments: Array<{
      filename: string;
      content: Buffer;
      cid: string;
      contentType: string;
      contentDisposition: "inline";
    }> = [];

    if (logoBuffer) {
      attachments.push({
        filename: "menuly-badge.png",
        content: logoBuffer,
        cid: "menuly-logo@menuly.com",
        contentType: "image/png",
        contentDisposition: "inline",
      });
    }

    if (mascotBuffer) {
      attachments.push({
        filename: "menuly-banner.png",
        content: mascotBuffer,
        cid: "menuly-mascot@menuly.com",
        contentType: "image/png",
        contentDisposition: "inline",
      });
    }

    const info = await mailTransporter.sendMail({
      from: fromHeader,
      to: toEmail,
      subject,
      html,
      text,
      attachments,
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

/**
 * Menuly Branded HTML Email Templates for OTP Authentication
 * Ultra-clean, modern, professional executive SaaS styling (zero emojis, clean typography).
 */

export type EmailTemplateType = "SIGNUP" | "PASSWORD_RESET" | "LOGIN";

export interface EmailTemplateOptions {
  otp: string;
  email: string;
  type: EmailTemplateType;
  expiresInMinutes?: number;
}

export function renderOtpEmail({
  otp,
  email,
  type,
  expiresInMinutes = 10,
}: EmailTemplateOptions): { subject: string; html: string; text: string } {
  let title = "Verify Your Email";
  let heading = "Confirm your email address";
  let subtitle = "Digital QR Menus for Restaurants & Cafes";
  let description =
    "Thank you for getting started with Menuly. Enter the single-use verification code below to verify your email and access your dashboard:";
  let subject = "Verify your email address for Menuly";

  if (type === "PASSWORD_RESET") {
    title = "Reset Your Password";
    heading = "Password Reset Request";
    subtitle = "Account Security";
    description =
      "We received a request to reset your Menuly password. Enter the verification code below to set a new password:";
    subject = "Reset your Menuly password";
  } else if (type === "LOGIN") {
    title = "Sign-In Code";
    heading = "Two-Factor Verification";
    subtitle = "Account Sign-In";
    description =
      "Use this one-time verification code to securely sign in to your Menuly restaurant account:";
    subject = "Your Menuly sign-in verification code";
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f5f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f5f7;
      padding: 48px 16px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
    }
    .header {
      background: #0f172a;
      padding: 36px 32px 32px 32px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 14px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .content {
      padding: 40px 36px 36px 36px;
      text-align: center;
    }
    .heading {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .desc {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 28px;
    }
    .otp-card {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 24px 28px;
      margin: 20px 0 28px 0;
      display: inline-block;
      min-width: 280px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin: 0 0 10px 0;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
      font-size: 40px;
      font-weight: 800;
      letter-spacing: 0.28em;
      color: #0f172a;
      margin: 0;
      text-align: center;
      padding-left: 0.28em;
      line-height: 1;
    }
    .expiry-note {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      margin-top: 12px;
      margin-bottom: 0;
    }
    .security-notice {
      background-color: #f8fafc;
      border-radius: 10px;
      padding: 16px 20px;
      text-align: left;
      font-size: 12px;
      color: #64748b;
      line-height: 1.55;
      border: 1px solid #e2e8f0;
      margin-top: 8px;
    }
    .security-title {
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    .footer {
      padding: 24px 32px 32px 32px;
      border-top: 1px solid #f1f5f9;
      background-color: #fafafa;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Minimalist Executive Header -->
      <div class="header">
        <div class="logo-badge">VERIFICATION CODE</div>
        <h1 class="brand-title">Menuly</h1>
        <p class="brand-subtitle">${subtitle}</p>
      </div>

      <!-- Main Body -->
      <div class="content">
        <h2 class="heading">${heading}</h2>
        <p class="desc">${description}</p>

        <!-- Clean High-Contrast OTP Card -->
        <div class="otp-card">
          <p class="otp-label">One-Time Verification Code</p>
          <div class="otp-code">${otp}</div>
          <p class="expiry-note">Expires in ${expiresInMinutes} minutes</p>
        </div>

        <!-- Security Advisory -->
        <div class="security-notice">
          <div class="security-title">Security Notice:</div>
          This verification code was requested for <b>${email}</b>. Menuly staff will never contact you asking for your verification code or password. If you did not initiate this request, you can safely disregard this message.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          Sent by <b>Menuly</b> · Digital Dining & QR Menu Solutions<br>
          Need help? Contact <a href="mailto:menulyofficial@gmail.com">menulyofficial@gmail.com</a>
        </p>
        <p style="margin: 0; opacity: 0.85;">
          © ${new Date().getFullYear()} Menuly Technologies. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `
Menuly — Digital QR Menus
${title}
========================================

${heading}
${description}

YOUR VERIFICATION CODE:
${otp}

(Expires in ${expiresInMinutes} minutes)

This code was requested for: ${email}
If you did not request this code, please ignore this email.

Need help? Contact support at menulyofficial@gmail.com
© ${new Date().getFullYear()} Menuly.
`.trim();

  return { subject, html, text };
}

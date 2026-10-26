/**
 * Menuly Branded HTML Email Templates for OTP Authentication
 * High-end luxury culinary executive SaaS styling with Menuly Logo, Mascot Banner,
 * high-contrast OTP digits, security advisory, and legal links (Terms & Conditions, Privacy Policy).
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
  let subtitle = "Smart Digital QR Menus for Restaurants & Cafes";
  let description =
    "Thank you for choosing Menuly. Enter the single-use verification code below to verify your email and activate your live digital menu dashboard:";
  let subject = "Verify your email address for Menuly";

  if (type === "PASSWORD_RESET") {
    title = "Reset Your Password";
    heading = "Password Reset Request";
    subtitle = "Account Security & Recovery";
    description =
      "We received a request to reset your Menuly password. Enter the single-use verification code below to set a new password:";
    subject = "Reset your password for Menuly";
  } else if (type === "LOGIN") {
    title = "Sign-In Code";
    heading = "Two-Factor Verification";
    subtitle = "Account Sign-In Security";
    description =
      "Use this single-use verification code to securely sign in to your Menuly restaurant account:";
    subject = "Sign in to your Menuly account";
  }

  const siteUrl = "https://menuly-app-blush.vercel.app";
  const termsUrl = `${siteUrl}/terms`;
  const privacyUrl = `${siteUrl}/privacy`;
  const contactUrl = `${siteUrl}/contact`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 36px 12px;
    }
    .email-container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
    }
    .email-header {
      background: linear-gradient(135deg, #0d3824 0%, #154c32 100%);
      padding: 32px 24px 26px 24px;
      text-align: center;
      color: #ffffff;
    }
    .logo-img {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.35);
      display: block;
      margin: 0 auto 12px auto;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
      color: #ffffff;
      line-height: 1.2;
    }
    .badge-pill {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #a7f3d0;
      margin-top: 8px;
    }
    .mascot-banner {
      padding: 16px 20px 0 20px;
      background-color: #ffffff;
    }
    .mascot-img {
      width: 100%;
      max-width: 540px;
      height: auto;
      border-radius: 14px;
      display: block;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .email-content {
      padding: 28px 30px 28px 30px;
      text-align: center;
    }
    .heading {
      font-size: 21px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px 0;
      letter-spacing: -0.01em;
    }
    .desc {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .otp-card {
      background: #f0fdf4;
      border: 2px dashed #22c55e;
      border-radius: 16px;
      padding: 22px 20px;
      margin: 20px auto 24px auto;
      max-width: 420px;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.08);
    }
    .otp-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #166534;
      margin: 0 0 8px 0;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
      font-size: 40px;
      font-weight: 900;
      letter-spacing: 0.24em;
      color: #0d3824;
      margin: 4px 0;
      text-align: center;
      padding-left: 0.24em;
      line-height: 1.1;
    }
    .expiry-note {
      font-size: 12px;
      font-weight: 600;
      color: #15803d;
      margin: 8px 0 0 0;
    }
    .security-notice {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 16px 20px;
      text-align: left;
      font-size: 12px;
      color: #64748b;
      line-height: 1.55;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #f59e0b;
      margin-top: 16px;
    }
    .security-title {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .email-footer {
      padding: 26px 28px 30px 28px;
      border-top: 1px solid #f1f5f9;
      background-color: #fafbfc;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-links {
      margin: 14px 0 16px 0;
      font-size: 12px;
    }
    .footer-links a {
      color: #047857;
      text-decoration: underline;
      font-weight: 700;
      margin: 0 6px;
    }
    .footer-links a:hover {
      color: #065f46;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Top Luxury Header with Official Logo -->
      <div class="email-header">
        <img
          src="https://cdn.jsdelivr.net/gh/grchetan/menuly-app@main/public/assets/menuly-badge.png?v=2"
          alt="Menuly Official Logo"
          class="logo-img"
          width="82"
          height="82"
          style="width: 82px; height: 82px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.35); display: block; margin: 0 auto 12px auto; object-fit: cover;"
        />
        <h1 class="brand-title">Menuly</h1>
        <div class="badge-pill">DIGITAL QR MENUS</div>
      </div>

      <!-- Mascot Avatar Showcase Banner -->
      <div class="mascot-banner">
        <img
          src="https://cdn.jsdelivr.net/gh/grchetan/menuly-app@main/public/assets/menuly-banner.png?v=2"
          alt="Menuly - Your Menu. One Scan Away."
          class="mascot-img"
          width="540"
          style="width: 100%; max-width: 540px; height: auto; border-radius: 14px; display: block; border: 1px solid #e2e8f0; margin: 0 auto;"
        />
      </div>

      <!-- Main Email Content -->
      <div class="email-content">
        <h2 class="heading">${heading}</h2>
        <p class="desc">${description}</p>

        <!-- High-Contrast Secure OTP Box -->
        <div class="otp-card">
          <div class="otp-label">VERIFICATION CODE</div>
          <div class="otp-code">${otp}</div>
          <div class="expiry-note">Expires in ${expiresInMinutes} minutes</div>
        </div>

        <!-- Security Advisory Notice -->
        <div class="security-notice">
          <div class="security-title">Security Reminder</div>
          This verification code was requested for <b>${email}</b>. Menuly team members will never ask for your verification code or password. If you did not initiate this request, you can safely disregard this email.
        </div>
      </div>

      <!-- Footer with Legal Links & Support -->
      <div class="email-footer">
        <div class="footer-links">
          <a href="${termsUrl}" target="_blank" rel="noreferrer">Terms &amp; Conditions</a> •
          <a href="${privacyUrl}" target="_blank" rel="noreferrer">Privacy Policy</a> •
          <a href="${contactUrl}" target="_blank" rel="noreferrer">Support Desk</a> •
          <a href="${siteUrl}" target="_blank" rel="noreferrer">Visit Menuly</a>
        </div>
        <p style="margin: 0 0 6px 0;">
          Sent by <b>Menuly</b> · Digital Dining &amp; QR Solutions<br>
          Need assistance? Contact us at <a href="mailto:menulyofficial@gmail.com" style="color: #047857; font-weight: 600; text-decoration: none;">menulyofficial@gmail.com</a>
        </p>
        <p style="margin: 0; opacity: 0.85;">
          &copy; ${new Date().getFullYear()} Menuly Technologies. All rights reserved.
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
>>> ${otp} <<<

(Expires in ${expiresInMinutes} minutes)

This code was requested for: ${email}
If you did not request this code, please ignore this email.

Legal & Support Links:
• Terms & Conditions: ${termsUrl}
• Privacy Policy: ${privacyUrl}
• Support: ${contactUrl}

Contact Support: menulyofficial@gmail.com
© ${new Date().getFullYear()} Menuly Technologies. All rights reserved.
`.trim();

  return { subject, html, text };
}

/**
 * Menuly Branded HTML Email Templates for OTP Authentication
 * Features: Pure Veg green palette, responsive design, 6-digit OTP display, security alerts.
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
  let heading = "Welcome to Menuly!";
  let subtitle = "Digital QR Menus for Pure Veg Restaurants";
  let description =
    "Thank you for signing up. Please enter the verification code below on the signup page to activate your restaurant menu account:";

  if (type === "PASSWORD_RESET") {
    title = "Reset Your Password";
    heading = "Password Reset Request";
    subtitle = "Account Security Verification";
    description =
      "We received a request to reset your Menuly account password. Enter this verification code to proceed:";
  } else if (type === "LOGIN") {
    title = "Your Login Code";
    heading = "Two-Factor Verification";
    subtitle = "Secure Account Sign-In";
    description =
      "Here is your one-time verification code to securely sign in to your Menuly dashboard:";
  }

  const subject = `[Menuly] ${otp} is your ${title} verification code`;

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
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 40px 15px;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
    }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .content {
      padding: 36px 32px;
      text-align: center;
    }
    .heading {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 10px;
    }
    .desc {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .otp-box {
      background-color: #f0fdf4;
      border: 2px dashed #86efac;
      border-radius: 16px;
      padding: 20px 24px;
      margin: 24px 0;
      display: inline-block;
      min-width: 260px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #065f46;
      margin: 0;
      text-align: center;
      padding-left: 0.25em;
    }
    .expiry-note {
      font-size: 12px;
      font-weight: 600;
      color: #15803d;
      margin-top: 8px;
      margin-bottom: 0;
    }
    .security-notice {
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 24px;
      text-align: left;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      border-left: 4px solid #10b981;
    }
    .security-title {
      font-weight: 700;
      color: #334155;
      margin-bottom: 4px;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 24px 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer a {
      color: #047857;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo-badge">🌱 100% PURE VEG PLATFORM</div>
        <h1 class="brand-title">Menuly</h1>
        <p class="brand-subtitle">${subtitle}</p>
      </div>

      <!-- Main Body -->
      <div class="content">
        <h2 class="heading">${heading}</h2>
        <p class="desc">${description}</p>

        <!-- OTP Display -->
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <p class="expiry-note">⏱ Valid for ${expiresInMinutes} minutes</p>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <div class="security-title">🔒 Security Best Practices:</div>
          • This code was requested for <b>${email}</b>.<br>
          • Menuly staff will NEVER call or ask you for your verification code.<br>
          • If you did not make this request, you can safely ignore this email.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          Sent by <b>Menuly</b> · Digital Dining & QR Menu Solutions<br>
          Support Helpline: <a href="mailto:menulyoffcial@gmail.com">menulyoffcial@gmail.com</a>
        </p>
        <p style="margin: 0; opacity: 0.8;">
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

(Valid for ${expiresInMinutes} minutes)

This code was requested for: ${email}
If you did not request this code, please ignore this email.

Need help? Contact support at menulyoffcial@gmail.com
© ${new Date().getFullYear()} Menuly.
`.trim();

  return { subject, html, text };
}

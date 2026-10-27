import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pino from "pino";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pg from "pg";
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 8000;
const API_SECRET = process.env.API_SECRET || "menuly-whatsapp-secret-2026";
const AUTH_DIR = path.join(__dirname, "auth_info_baileys");
const DATABASE_URL = process.env.DATABASE_URL;

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Optional PostgreSQL Database Pool for Session Persistence (Render / Supabase)
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 30000,
  });
}

// Restore session files from Supabase if local folder is missing or fresh deploy
async function restoreSessionFromDb() {
  if (!pool) return;
  try {
    const res = await pool.query("SELECT value FROM platform_settings WHERE key = 'whatsapp_session' LIMIT 1");
    if (res.rows.length > 0 && res.rows[0].value) {
      const files = res.rows[0].value;
      let count = 0;
      for (const [filename, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(AUTH_DIR, filename), String(content), "utf8");
        count++;
      }
      console.log(`[Database Sync] Restored ${count} WhatsApp session files from Supabase database!`);
    }
  } catch (err) {
    console.warn("[Database Sync Warning] Could not restore session from DB:", err instanceof Error ? err.message : String(err));
  }
}

// Debounced backup of session files to Supabase
let backupTimeout = null;
function triggerSessionBackup() {
  if (!pool) return;
  if (backupTimeout) clearTimeout(backupTimeout);
  backupTimeout = setTimeout(async () => {
    try {
      if (!fs.existsSync(AUTH_DIR)) return;
      const fileNames = fs.readdirSync(AUTH_DIR);
      if (fileNames.length === 0) return;
      const sessionData = {};
      for (const f of fileNames) {
        sessionData[f] = fs.readFileSync(path.join(AUTH_DIR, f), "utf8");
      }
      await pool.query(
        "INSERT INTO platform_settings (key, value, updated_at) VALUES ('whatsapp_session', $1::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()",
        [JSON.stringify(sessionData)]
      );
      console.log(`[Database Sync] Successfully backed up ${fileNames.length} session files to Supabase!`);
    } catch (err) {
      console.warn("[Database Sync Warning] Failed to backup session to DB:", err instanceof Error ? err.message : String(err));
    }
  }, 2500);
}

// Bot In-Memory State
let sock = null;
let currentQr = null;
let currentQrDataUrl = null;
let isConnected = false;
let botPhoneNumber = null;
let startTime = Date.now();
let totalMessagesSent = 0;

// Initialize WhatsApp Socket
async function startWhatsAppBot() {
  // If local auth folder is empty or brand new container, attempt restoring from Supabase DB
  const existingFiles = fs.existsSync(AUTH_DIR) ? fs.readdirSync(AUTH_DIR) : [];
  if (existingFiles.length < 3) {
    await restoreSessionFromDb();
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: "silent" });

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ["Menuly Official", "Chrome", "1.0.0"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on("creds.update", async () => {
    await saveCreds();
    triggerSessionBackup();
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      isConnected = false;
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
      } catch (err) {
        console.error("[QR Error]:", err);
      }

      console.log("\n========================================================");
      console.log("📲 MENULY WHATSAPP BOT — PLEASE SCAN THIS QR CODE:");
      console.log("========================================================");
      qrcodeTerminal.generate(qr, { small: true });
      console.log(`🌐 Or open dashboard in browser: http://localhost:${PORT}`);
      console.log("========================================================\n");
    }

    if (connection === "close") {
      isConnected = false;
      botPhoneNumber = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WhatsApp] Connection closed. Reason: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      } else {
        console.log("[WhatsApp] Logged out. Resetting session folder...");
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        setTimeout(startWhatsAppBot, 2000);
      }
    } else if (connection === "open") {
      isConnected = true;
      currentQr = null;
      currentQrDataUrl = null;
      botPhoneNumber = sock.user?.id ? sock.user.id.split(":")[0] : "Connected";

      console.log("\n========================================================");
      console.log("✅ MENULY WHATSAPP BOT IS LIVE & CONNECTED!");
      console.log(`📱 Linked WhatsApp Number: +${botPhoneNumber}`);
      console.log(`🚀 Ready to receive /send-otp requests on port ${PORT}`);
      console.log("========================================================\n");

      // Trigger initial backup once connected
      triggerSessionBackup();
    }
  });
}

// Start WhatsApp connection
startWhatsAppBot();

// Express HTTP Server
const app = express();
app.use(cors());
app.use(express.json());

// Anti-Sleep Self-Pinger for Render / Free Cloud Hosting
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15m)

if (SELF_URL) {
  console.log(`[Anti-Sleep] Enabled self-pinging target: ${SELF_URL}/ping every 10m`);
  setInterval(async () => {
    try {
      const pingUrl = `${SELF_URL.replace(/\/$/, "")}/ping`;
      const res = await fetch(pingUrl);
      console.log(`[Anti-Sleep] Self-ping status: ${res.status} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.warn(`[Anti-Sleep] Ping attempt failed:`, err instanceof Error ? err.message : String(err));
    }
  }, PING_INTERVAL_MS);
}

// 0. Lightweight Ping / Health Endpoint (Keeps Render Awake 24/7)
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// 1. Web Dashboard (Visual Status & QR Code Display)
app.get("/", (req, res) => {
  const uptimeMinutes = Math.floor((Date.now() - startTime) / 60000);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menuly WhatsApp OTP Gateway</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 36px 32px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .logo-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 20px; }
    .badge-off { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #ffffff; }
    p.sub { font-size: 14px; color: #94a3b8; margin-bottom: 28px; line-height: 1.5; }
    .qr-box { background: #ffffff; padding: 18px; border-radius: 18px; display: inline-block; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
    .qr-box img { display: block; border-radius: 8px; max-width: 280px; width: 100%; height: auto; }
    .steps { text-align: left; background: #0f172a; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px; font-size: 13px; color: #cbd5e1; line-height: 1.7; border: 1px solid #334155; }
    .steps ol { padding-left: 20px; }
    .status-box { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
    .stat-card { background: #0f172a; padding: 12px; border-radius: 12px; border: 1px solid #334155; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .stat-val { font-size: 16px; font-weight: 800; color: #f8fafc; margin-top: 4px; }
    .test-box { margin-top: 24px; text-align: left; }
    .test-box input { width: 100%; padding: 12px 14px; border-radius: 12px; background: #0f172a; border: 1px solid #334155; color: #ffffff; font-size: 14px; margin-bottom: 10px; }
    .test-box button { width: 100%; padding: 12px; border-radius: 12px; background: #16a34a; border: none; color: #ffffff; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .test-box button:hover { background: #15803d; }
  </style>
</head>
<body>
  <div class="card">
    ${
      isConnected
        ? `
      <div class="logo-badge">🟢 LIVE & CONNECTED</div>
      <h1>Menuly WhatsApp Bot Online</h1>
      <p class="sub">Your WhatsApp account is successfully linked and actively sending verification OTPs for Menuly.</p>

      <div class="status-box">
        <div style="font-size: 14px; font-weight: 700; color: #4ade80;">Active Phone: +${botPhoneNumber}</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">OTPs Sent</div>
            <div class="stat-val">${totalMessagesSent}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Uptime</div>
            <div class="stat-val">${uptimeMinutes} mins</div>
          </div>
        </div>
      </div>

      <div class="test-box">
        <label style="font-size: 12px; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 6px;">Send Test OTP via WhatsApp</label>
        <input type="text" id="phoneInput" placeholder="Enter 10-digit mobile (e.g. 9876543210)" />
        <button onclick="sendTestOtp()">Send Test Verification Code</button>
        <div id="testRes" style="margin-top: 10px; font-size: 12px; text-align: center;"></div>
      </div>

      <script>
        async function sendTestOtp() {
          const phone = document.getElementById('phoneInput').value.trim();
          const resEl = document.getElementById('testRes');
          if (!phone) { alert('Please enter phone number'); return; }
          resEl.innerHTML = '<span style="color: #94a3b8;">Sending WhatsApp message...</span>';
          try {
            const res = await fetch('/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': '${API_SECRET}' },
              body: JSON.stringify({ phone, otp: Math.floor(100000 + Math.random() * 900000).toString() })
            });
            const data = await res.json();
            if (data.success) {
              resEl.innerHTML = '<span style="color: #4ade80;">✅ WhatsApp OTP Sent Successfully! Check your phone.</span>';
            } else {
              resEl.innerHTML = '<span style="color: #f87171;">❌ Failed: ' + (data.error || 'Unknown error') + '</span>';
            }
          } catch (e) {
            resEl.innerHTML = '<span style="color: #f87171;">❌ Network error</span>';
          }
        }
      </script>
    `
        : `
      <div class="logo-badge badge-off">🔴 AWAITING SCAN</div>
      <h1>Scan WhatsApp QR Code</h1>
      <p class="sub">Link your WhatsApp to start sending automated verification codes to diners and restaurant owners.</p>

      ${
        currentQrDataUrl
          ? `
        <div class="qr-box">
          <img src="${currentQrDataUrl}" alt="WhatsApp QR Code" />
        </div>
      `
          : `
        <div style="padding: 40px 0; color: #94a3b8; font-size: 14px;">Generating fresh QR code...</div>
      `
      }

      <div class="steps">
        <div style="font-weight: 700; color: #ffffff; margin-bottom: 6px;">How to link:</div>
        <ol>
          <li>Open WhatsApp on your phone</li>
          <li>Tap <b>Menu (⋮)</b> or <b>Settings</b></li>
          <li>Select <b>Linked Devices</b></li>
          <li>Tap <b>Link a Device</b> and point camera here</li>
        </ol>
      </div>

      <script>
        // Auto-refresh page every 15s if awaiting QR
        setTimeout(() => window.location.reload(), 15000);
      </script>
    `
    }
  </div>
</body>
</html>`);
});

// 2. Health & Status Check Endpoint
app.get("/status", (req, res) => {
  res.json({
    connected: isConnected,
    phone: botPhoneNumber,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    totalMessagesSent,
    hasQr: Boolean(currentQr),
  });
});

// 3. Send OTP Endpoint
app.post("/send-otp", async (req, res) => {
  const authHeader = req.headers["x-api-key"] || req.query["api_key"];

  if (API_SECRET && authHeader !== API_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid API Key" });
  }

  if (!isConnected || !sock) {
    return res.status(503).json({
      success: false,
      error: "WhatsApp bot is not connected yet. Please scan the QR code first.",
    });
  }

  const { phone, otp, type = "SIGNUP" } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, error: "Missing required fields: phone and otp" });
  }

  // Format and clean phone number (e.g. +91 98765-43210 -> 919876543210)
  let cleanNumber = String(phone).replace(/\D/g, "");

  // If standard 10-digit Indian number without country code, prefix 91
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  } else if (cleanNumber.length === 11 && cleanNumber.startsWith("0")) {
    cleanNumber = `91${cleanNumber.slice(1)}`;
  }

  const jid = `${cleanNumber}@s.whatsapp.net`;

  let actionTitle = "Verify Your Account";
  if (type === "PASSWORD_RESET") {
    actionTitle = "Reset Your Password";
  } else if (type === "LOGIN") {
    actionTitle = "Sign In Verification";
  }

  const messageText = `🍽️ *MENULY — DIGITAL QR MENUS*
${actionTitle}
────────────────────────

Your single-use verification code is:
👉  *${otp}*  👈

⏱️ *Valid for 10 minutes.*
🔒 *Do not share this code with anyone.*

Thank you for choosing Menuly for your restaurant.
────────────────────────
_Sent securely by Menuly Technologies_
_Visit: https://menuly-app-blush.vercel.app_`;

  try {
    const result = await sock.sendMessage(jid, { text: messageText });
    totalMessagesSent++;

    console.log(`[WhatsApp OTP] Successfully sent code ${otp} to +${cleanNumber}`);

    return res.json({
      success: true,
      messageId: result?.key?.id,
      phone: cleanNumber,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WhatsApp OTP Error] Failed to send to +${cleanNumber}:`, errorMsg);

    return res.status(500).json({
      success: false,
      error: errorMsg,
      phone: cleanNumber,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Menuly WhatsApp Service listening on http://0.0.0.0:${PORT}`);
});

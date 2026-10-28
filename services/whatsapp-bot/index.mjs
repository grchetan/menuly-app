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

// Rate limiting in-memory map for anti-abuse protection
const ipRequestCounts = new Map();
setInterval(() => ipRequestCounts.clear(), 60000); // Reset counts every minute

// 1. Production Secure Status Endpoint (No Secrets or Testing Tools Exposed to Public)
app.get("/", (req, res) => {
  // If admin query key matches API_SECRET and not connected, display QR code for linking
  const adminKey = req.query["admin_key"] || req.headers["x-api-key"];
  const isAdmin = API_SECRET && adminKey === API_SECRET;

  if (isAdmin && !isConnected && currentQrDataUrl) {
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Menuly WhatsApp Gateway — QR Link</title>
  <style>
    body { background: #0f172a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 32px; border-radius: 20px; text-align: center; max-width: 400px; }
    img { border-radius: 12px; margin: 20px 0; max-width: 260px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Scan WhatsApp QR</h2>
    <img src="${currentQrDataUrl}" alt="QR" />
    <p style="font-size: 13px; color: #94a3b8;">Open WhatsApp &gt; Linked Devices &gt; Link a Device</p>
  </div>
</body>
</html>`);
  }

  // To any public visitor or automated scanner, return clean minimal secure JSON
  return res.status(200).json({
    status: "online",
    service: "Menuly Secure Gateway",
    connected: isConnected,
    timestamp: new Date().toISOString(),
  });
});

// 2. Health & Status Check Endpoint (Strictly Protected by API Secret)
app.get("/status", (req, res) => {
  const authHeader = req.headers["x-api-key"] || req.query["key"];
  if (API_SECRET && authHeader !== API_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  res.json({
    connected: isConnected,
    phone: botPhoneNumber ? `+${botPhoneNumber.slice(0, 4)}****` : null,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    totalMessagesSent,
  });
});

// 3. Send OTP Endpoint (Strict Authentication & Rate Limiting)
app.post("/send-otp", async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "global";
  const authHeader = req.headers["x-api-key"];

  // Strictly enforce Server-to-Server Secret Header
  if (!API_SECRET || authHeader !== API_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid API Key" });
  }

  // Rate Limiting: Max 20 OTP dispatches per minute per IP
  const currentCount = (ipRequestCounts.get(clientIp) || 0) + 1;
  ipRequestCounts.set(clientIp, currentCount);
  if (currentCount > 20) {
    return res.status(429).json({ success: false, error: "Too many requests. Please wait." });
  }

  if (!isConnected || !sock) {
    return res.status(503).json({
      success: false,
      error: "WhatsApp bot is not connected yet.",
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

  let actionTitle = "Account Verification";
  let purposeDescription = "Your single-use verification code is:";
  if (type === "PASSWORD_RESET") {
    actionTitle = "Password Reset Request";
    purposeDescription = "Your password reset code is:";
  } else if (type === "LOGIN") {
    actionTitle = "Sign-In Verification";
    purposeDescription = "Your sign-in security code is:";
  }

  const messageText = `🍽️ *MENULY — DIGITAL QR MENUS*
*${actionTitle}*
────────────────────────

${purposeDescription}

👉  *${otp}*  👈

📋 *Quick Copy Code:*
\`${otp}\`
_(Tap or long-press the code above to copy)_

⏱️ *Valid for 10 minutes.*
🔒 *Do not share this code with anyone.* Menuly staff will never ask for your OTP.

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

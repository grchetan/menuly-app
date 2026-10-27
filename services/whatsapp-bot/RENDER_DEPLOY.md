# 🚀 Menuly WhatsApp Bot — Render 24/7 Deployment Guide

This microservice runs Menuly's official WhatsApp OTP Verification Gateway using Baileys WebSockets.
It includes **Anti-Sleep Self-Pinging** and **Automated Supabase Session Persistence** so it never goes to sleep and never loses its login session.

---

## 📋 Steps to Deploy on Render (100% Free)

### Step 1: Push Code to GitHub
Ensure you have committed and pushed the latest code to your GitHub repository:
```bash
git push
```

### Step 2: Create Web Service on Render
1. Open [dashboard.render.com](https://dashboard.render.com) and log in with your GitHub account.
2. Click **New +** at the top right and select **Web Service**.
3. Select **"Build and deploy from a Git repository"** and choose your `menuly` repository.
4. Configure the settings:
   - **Name**: `menuly-whatsapp-bot`
   - **Region**: `Singapore` (Fastest for India) or `Frankfurt`
   - **Branch**: `main`
   - **Root Directory**: `services/whatsapp-bot`  *(IMPORTANT!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ($0 / month)

### Step 3: Add Environment Variables in Render
Scroll down to the **Environment Variables** section and add:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | *(Paste your Supabase Connection String from your .env)* | Auto-syncs WhatsApp session so you never have to scan QR again! |
| `API_SECRET` | `menuly-whatsapp-secret-2026` | Protects the `/send-otp` endpoint from unauthorized access |
| `PORT` | `8000` | Port for the HTTP server |

*(Render automatically injects `RENDER_EXTERNAL_URL`, which activates the built-in 10-minute Anti-Sleep self-pinger).*

### Step 4: Click "Create Web Service"
Render will build the service in ~1 minute. Once live, you will get a URL like:
`https://menuly-whatsapp-bot.onrender.com`

---

## 🔗 Step 5: Connect to Menuly Website on Vercel

1. Open your Vercel Project Dashboard (`menuly`).
2. Go to **Settings** > **Environment Variables**.
3. Add:
   - **Key**: `WHATSAPP_BOT_URL`
   - **Value**: `https://menuly-whatsapp-bot.onrender.com`  *(Your Render URL)*
   - **Key**: `WHATSAPP_BOT_SECRET`
   - **Value**: `menuly-whatsapp-secret-2026`
4. Redeploy Vercel or trigger a new build.

**Done!** Now any user registering or requesting verification codes will receive their OTP directly on WhatsApp in <1 second!

# Menuly Backend & Custom OTP Authentication Setup Guide

This comprehensive guide walks you through setting up **Menuly** with **Supabase PostgreSQL**, **Prisma ORM**, and **Custom Gmail OTP Authentication** using your `menulyoffcial@gmail.com` account.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Setting Up Supabase PostgreSQL Database](#step-1-setting-up-supabase-postgresql-database)
4. [Step 2: Generating Gmail App Password for OTPs](#step-2-generating-gmail-app-password-for-otps)
5. [Step 3: Configuring Environment Variables (`.env`)](#step-3-configuring-environment-variables-env)
6. [Step 4: Running Prisma Migrations & Generating Client](#step-4-running-prisma-migrations--generating-client)
7. [Step 5: Seeding the First Super Admin Account](#step-5-seeding-the-first-super-admin-account)
8. [Step 6: Starting the Application Locally](#step-6-starting-the-application-locally)
9. [Step 7: Testing Authentication with Sample API Requests](#step-7-testing-authentication-with-sample-api-requests)
10. [Step 8: Role-Based Access Control (RBAC) Rules](#step-8-role-based-access-control-rbac-rules)
11. [Troubleshooting & Common Errors](#troubleshooting--common-errors)

---

## 1. Architecture Overview

- **Database**: Supabase Hosted PostgreSQL with Prisma ORM.
- **Custom Auth System**: No third-party auth lock-in (zero Supabase Auth/Firebase Auth reliance).
- **OTP Delivery**: Native Nodemailer transport using Gmail SMTP (`menuly@gmail.com`).
- **Templates**: Custom Menuly branded responsive HTML emails with professional security badges.
- **Security**: 
  - Passwords hashed with `bcryptjs` (salt rounds: 10).
  - OTPs hashed with `bcryptjs` before database persistence (raw OTPs never stored in plaintext).
  - In-memory sliding-window rate limiting to block brute force attempts.
  - JWT access tokens (7-day validity) and SHA-256 hashed refresh tokens.
  - Role-based access control (`SUPER_ADMIN`, `RESTAURANT_OWNER`, `STAFF`). Public registration strictly assigns `RESTAURANT_OWNER`.

---

## 2. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (Recommended: `v22.20.0`)
- **Package Manager**: `npm` (included with Node.js)
- **Supabase Account**: Free or Pro tier at [https://supabase.com](https://supabase.com)
- **Google Account**: Access to `menulyoffcial@gmail.com`

---

## Step 1: Setting Up Supabase PostgreSQL Database

1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Click **New Project**:
   - **Name**: `menuly` (or your choice)
   - **Database Password**: Choose a strong password and **copy it safely**. (You will need this in your connection string).
   - **Region**: Choose the region closest to your customers (e.g., `South Asia (Mumbai)` for India).
   - Click **Create new project** and wait ~1-2 minutes for provisioning.
3. Once the project dashboard loads:
   - Click the **Settings (gear icon)** at the bottom left.
   - Go to **Database**.
   - Scroll down to the **Connection parameters / Connection string** section.
4. Select the **URI** tab:
   - **Connection Pooler (Transaction mode, port 6543)** — Copy this for `DATABASE_URL`:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```
   - **Direct Connection (Session mode, port 5432)** — Copy this for `DIRECT_URL`:
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
5. Replace `[YOUR-PASSWORD]` with the actual database password you chose in step 2.

---

## Step 2: Generating Gmail App Password for OTPs

To send verification emails securely from `menulyoffcial@gmail.com` without sharing your main Google password:

1. Open your browser and log into `menulyoffcial@gmail.com`.
2. Go to **Google Account Settings**: [https://myaccount.google.com/](https://myaccount.google.com/)
3. Click on the **Security** tab on the left.
4. Under *"How you sign in to Google"*:
   - Ensure **2-Step Verification** is turned **ON**. (Required by Google to generate App Passwords).
5. Search for or click on **App passwords**: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
6. In the App name input, type: `Menuly OTP Backend`
7. Click **Create**.
8. A modal will appear showing a **16-character password** (e.g., `abcd efgh ijkl mnop`).
9. Copy this 16-character code (without spaces: `abcdefghijklmnop`). This is your `SMTP_PASS`.

> [!IMPORTANT]
> Never share this App Password or commit it to GitHub. It belongs only in your local `.env` file.

---

## Step 3: Configuring Environment Variables (`.env`)

1. In the project root, duplicate `.env.example` to create `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `.env` and fill in your actual credentials:

```ini
# ==============================================================================
# 1. DATABASE CONNECTION (Supabase PostgreSQL + Prisma ORM)
# ==============================================================================
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ==============================================================================
# 2. GMAIL SMTP CONFIGURATION (menulyoffcial@gmail.com)
# ==============================================================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="menulyoffcial@gmail.com"
SMTP_PASS="abcdefghijklmnop" # <-- Paste your 16-char Gmail App Password here
SMTP_FROM_NAME="Menuly"
SMTP_FROM_EMAIL="menulyoffcial@gmail.com"

# ==============================================================================
# 3. JWT & AUTHENTICATION SECURITY
# ==============================================================================
JWT_SECRET="menuly-production-super-secret-key-at-least-32-chars-long"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="menuly-refresh-token-secret-key-at-least-32-chars-long"
REFRESH_TOKEN_EXPIRES_IN="30d"

OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60

# ==============================================================================
# 4. INITIAL SUPER ADMIN CREDENTIALS
# ==============================================================================
SUPER_ADMIN_EMAIL="admin@menuly.com"
SUPER_ADMIN_PASSWORD="YourSuperSecureAdminPassword123!"

# ==============================================================================
# 5. APPLICATION CONFIG
# ==============================================================================
APP_URL="http://localhost:3000"
PORT=3000
NODE_ENV="development"
```

---

## Step 4: Running Prisma Migrations & Generating Client

With your `DATABASE_URL` configured in `.env`, run the database migrations and generate the typed client:

### Option A: Push Schema Directly (Quickest for Supabase)
```powershell
npm run prisma:push
```

### Option B: Run Migration Deploy (Production Standard)
```powershell
npm run prisma:migrate
```

### Regenerate Prisma Client
```powershell
npm run prisma:generate
```

This will create all tables (`users`, `otp_verifications`, `sessions`, `plans`, `restaurants`, `categories`, `menu_items`, `restaurant_tables`, `qr_scans`, `support_tickets`, `platform_settings`) directly in your Supabase PostgreSQL database.

---

## Step 5: Seeding the First Super Admin Account

To provision your initial Super Admin account securely:

```powershell
npm run seed:admin
```

Expected Terminal Output:
```text
==================================================
🛡️  Menuly Super Admin Provisioning
==================================================
Target Email: admin@menuly.com
[Super Admin] Created new super admin: admin@menuly.com (Role: SUPER_ADMIN)
✅ Super Admin Account Ready:
   ID:    usr-xxxxxxx
   Email: admin@menuly.com
   Role:  SUPER_ADMIN
==================================================
You can now log in at http://localhost:3000/auth
==================================================
```

---

## Step 6: Starting the Application Locally

Start the Vite development server:
```powershell
npm run dev
```

The server will start at `http://localhost:3000`.

Check backend health and connection status anytime:
```powershell
curl http://localhost:3000/api/health
```

---

## Step 7: Testing Authentication with Sample API Requests

All endpoints accept standard JSON requests and return structured JSON responses.

### 1. Check API Health
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -Method Get
```
Response:
```json
{
  "status": "ok",
  "platform": "Menuly",
  "timestamp": "2026-10-20T...",
  "database": { "connected": true },
  "smtp": { "user": "menulyoffcial@gmail.com", "configured": true }
}
```

---

### 2. Sign Up a Restaurant Owner (`POST /api/auth/signup`)
```powershell
$signupBody = @{
    email = "owner@royalspice.in"
    password = "ChefPassword123!"
    fullName = "Chef Rajesh"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/signup' -Method Post -Body $signupBody -ContentType 'application/json'
```
Response:
```json
{
  "success": true,
  "status": 200,
  "message": "Verification code sent to owner@royalspice.in. Please check your email.",
  "data": {
    "email": "owner@royalspice.in",
    "requiresVerification": true
  }
}
```

> **Note**: An email with your 6-digit OTP is sent via `menulyoffcial@gmail.com`. If `SMTP_PASS` is empty during local testing, the OTP will be displayed directly in your server terminal log.

---

### 3. Verify OTP (`POST /api/auth/verify-otp`)
```powershell
$verifyBody = @{
    email = "owner@royalspice.in"
    otp = "123456" # Replace with actual 6-digit OTP received
    type = "SIGNUP"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/verify-otp' -Method Post -Body $verifyBody -ContentType 'application/json'
Write-Host "JWT Token:" $auth.data.token
```
Response:
```json
{
  "success": true,
  "status": 200,
  "message": "Email verified successfully! Welcome to Menuly.",
  "data": {
    "user": {
      "id": "usr-...",
      "email": "owner@royalspice.in",
      "role": "RESTAURANT_OWNER",
      "fullName": "Chef Rajesh"
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "..."
  }
}
```

---

### 4. Log In (`POST /api/auth/login`)
```powershell
$loginBody = @{
    email = "owner@royalspice.in"
    password = "ChefPassword123!"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
```

---

### 5. Resend OTP (`POST /api/auth/resend-otp`)
Protected with a 60-second cooldown timer:
```powershell
$resendBody = @{
    email = "owner@royalspice.in"
    type = "SIGNUP"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/resend-otp' -Method Post -Body $resendBody -ContentType 'application/json'
```

---

### 6. Get Current User Profile (`GET /api/auth/me`)
```powershell
$headers = @{
    Authorization = "Bearer $($auth.data.token)"
}

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/me' -Method Get -Headers $headers
```

---

### 7. Forgot Password (`POST /api/auth/forgot-password`)
```powershell
$forgotBody = @{
    email = "owner@royalspice.in"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/forgot-password' -Method Post -Body $forgotBody -ContentType 'application/json'
```

---

### 8. Reset Password with OTP (`POST /api/auth/reset-password`)
```powershell
$resetBody = @{
    email = "owner@royalspice.in"
    otp = "654321" # 6-digit OTP from password reset email
    newPassword = "NewSecretPassword456!"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/reset-password' -Method Post -Body $resetBody -ContentType 'application/json'
```

---

### 9. Super Admin Protected Route (`GET /api/admin/users`)
```powershell
# Only succeeds when calling with a SUPER_ADMIN token:
$adminHeaders = @{
    Authorization = "Bearer $adminToken"
}

Invoke-RestMethod -Uri 'http://localhost:3000/api/admin/users' -Method Get -Headers $adminHeaders
```
*If called with a `RESTAURANT_OWNER` token, the server returns `403 Forbidden`.*

---

## Step 8: Role-Based Access Control (RBAC) Rules

| Role | Permissions & Access |
|---|---|
| `SUPER_ADMIN` | • Full system access.<br>• Unlocks the Super Admin Panel (`/admin`).<br>• Manages all restaurants, plans, platform settings & user accounts.<br>• Can call `/api/admin/*` endpoints. |
| `RESTAURANT_OWNER` | • Default role assigned on public registration.<br>• Manages dishes, pricing, photos, tables, and QR codes (`/dashboard`, `/my-menu`, `/qr`).<br>• Strictly blocked from `/admin` and `/api/admin/*`. |
| `STAFF` | • Kitchen & table view for orders and marking sold-out dishes. |

---

## Troubleshooting & Common Errors

### 1. `EAUTH: Invalid login: 535-5.7.8 Username and Password not accepted`
- **Cause**: Using regular Gmail account password instead of Google App Password, or 2-Step Verification is disabled.
- **Fix**:
  1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security) and ensure **2-Step Verification** is turned ON.
  2. Generate a fresh 16-character password at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
  3. Paste the 16 characters into `.env` as `SMTP_PASS="abcdefghijklmnop"` (no spaces).
  4. Restart server (`npm run dev`).

### 2. `P1001: Can't reach database server at aws-0-....pooler.supabase.com:6543`
- **Cause**: Incorrect database password or network firewall blocking port 6543.
- **Fix**:
  1. Check if the password in `DATABASE_URL` contains special characters like `@` or `:`. If so, URL-encode them (`@` becomes `%40`).
  2. Make sure you included `?pgbouncer=true&connection_limit=1` at the end of the URL for port 6543.
  3. Test using `DIRECT_URL` (port 5432) for running schema pushes.

### 3. `429 Too Many Requests`
- **Cause**: Rate limit triggered after 5 rapid failed signup or login attempts.
- **Fix**: Wait for the cooldown window (15 minutes) or restart the local development server to clear the in-memory rate limit map.

### 4. `403 Forbidden on /admin`
- **Cause**: Logged-in user has role `RESTAURANT_OWNER` instead of `SUPER_ADMIN`.
- **Fix**: Run `npm run seed:admin` to provision an admin account, then log in with `admin@menuly.com`.

---

## Security Checklist Before Production Deployment

- [ ] `.env` is listed in `.gitignore` (verified).
- [ ] Database connection string uses strong random password.
- [ ] `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are replaced with random 64-character strings (`openssl rand -hex 32`).
- [ ] Gmail App Password is kept secret.
- [ ] Default Super Admin password (`SUPER_ADMIN_PASSWORD`) is changed from default.
- [ ] `NODE_ENV="production"` is set in production deployment.

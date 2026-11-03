import crypto from "crypto";
import { userStore, pendingRegistrationStore } from "./store";
import {
  hashPassword,
  signAccessToken,
  generateRefreshToken,
  type TokenPayload,
} from "./security";
import { checkRateLimit, AuthRateLimits } from "./rate-limiter";

export interface GoogleUserPayload {
  email: string;
  fullName?: string | null;
  sub?: string | null;
  picture?: string | null;
  emailVerified?: boolean;
}

export interface GoogleAuthResult {
  success: boolean;
  status: number;
  message?: string;
  error?: string;
  data?: {
    user?: {
      id: string;
      email: string;
      role: string;
      fullName: string | null;
      phone?: string | null;
    };
    token?: string;
    refreshToken?: string;
    isNewUser?: boolean;
  };
}

/**
 * Returns public Google OAuth client configuration for the frontend
 */
export function getGoogleAuthConfig() {
  const clientId =
    process.env["GOOGLE_CLIENT_ID"] ||
    process.env["VITE_GOOGLE_CLIENT_ID"] ||
    "";
  return {
    configured: Boolean(clientId && clientId.trim()),
    clientId: clientId.trim() || null,
  };
}

/**
 * Verifies a Google ID Token using Google's official tokeninfo endpoint
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleUserPayload | null> {
  if (!idToken || typeof idToken !== "string") return null;

  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`,
      { method: "GET" }
    );

    if (!res.ok) {
      console.warn("[Google Auth] Tokeninfo verification failed with status:", res.status);
      return null;
    }

    const payload = (await res.json()) as {
      iss?: string;
      sub?: string;
      aud?: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
      picture?: string;
    };

    // Verify token issuer is Google
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      console.warn("[Google Auth] Invalid issuer:", payload.iss);
      return null;
    }

    // Verify audience if GOOGLE_CLIENT_ID is configured
    const expectedClientId =
      process.env["GOOGLE_CLIENT_ID"] || process.env["VITE_GOOGLE_CLIENT_ID"];
    if (expectedClientId && payload.aud && payload.aud !== expectedClientId.trim()) {
      console.warn("[Google Auth] Client ID audience mismatch:", {
        received: payload.aud,
        expected: expectedClientId,
      });
      return null;
    }

    // Verify email was verified by Google
    const isVerified =
      payload.email_verified === true || payload.email_verified === "true";
    if (!payload.email || !isVerified) {
      console.warn("[Google Auth] Unverified Google email:", payload.email);
      return null;
    }

    return {
      email: payload.email,
      fullName: payload.name || null,
      sub: payload.sub || null,
      picture: payload.picture || null,
      emailVerified: true,
    };
  } catch (err) {
    console.error("[Google Auth Error] Failed to verify ID token:", err);
    return null;
  }
}

/**
 * Exchanges Google OAuth Authorization Code for tokens and user details
 */
export async function exchangeGoogleAuthCode(params: {
  code: string;
  redirectUri: string;
}): Promise<GoogleUserPayload | null> {
  const { code, redirectUri } = params;
  const clientId =
    process.env["GOOGLE_CLIENT_ID"] || process.env["VITE_GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    console.warn("[Google Auth] OAuth code exchange requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    return null;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      console.warn("[Google Auth] Code exchange failed with status:", tokenRes.status);
      return null;
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    if (tokenData.id_token) {
      return verifyGoogleIdToken(tokenData.id_token);
    }

    if (tokenData.access_token) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userRes.ok) {
        const userInfo = (await userRes.json()) as {
          email?: string;
          email_verified?: boolean;
          name?: string;
          sub?: string;
          picture?: string;
        };
        if (userInfo.email) {
          return {
            email: userInfo.email,
            fullName: userInfo.name || null,
            sub: userInfo.sub || null,
            picture: userInfo.picture || null,
            emailVerified: Boolean(userInfo.email_verified),
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error("[Google Auth Error] Code exchange exception:", err);
    return null;
  }
}

/**
 * Core Google One-Click Authentication Handler
 * - If email exists in database -> Logs user into existing account.
 * - If email is new -> Creates new account with verified status & logs user in.
 */
export async function handleGoogleAuth(params: {
  googleUser: GoogleUserPayload;
  clientIp?: string;
}): Promise<GoogleAuthResult> {
  const { googleUser, clientIp = "global" } = params;
  const rawEmail = googleUser.email?.trim().toLowerCase();

  if (!rawEmail || !rawEmail.includes("@")) {
    return {
      success: false,
      status: 400,
      error: "Google account did not provide a valid email address.",
    };
  }

  // Rate limiting per IP to avoid abuse
  const rate = checkRateLimit(`google-auth:${clientIp}`, AuthRateLimits.LOGIN);
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Too many sign-in attempts. Please wait ${rate.resetInSeconds} seconds.`,
    };
  }

  // 1. Check if user already exists in database
  let user = await userStore.findByEmail(rawEmail);

  if (user) {
    // Check if account has been deleted (soft-deleted into Trash)
    if (user.deletedAt) {
      return {
        success: false,
        status: 403,
        error: "Menuly Official: Your account has been deleted by administration.",
      };
    }

    // Check if account has been suspended / banned
    if (user.isBanned) {
      return {
        success: false,
        status: 403,
        error:
          user.banReason ||
          "Your account has been suspended by Menuly Administration.",
      };
    }

    // Since Google verified the email, ensure user is marked as verified
    if (!user.isVerified) {
      const updated = await userStore.update(user.id, { isVerified: true });
      if (updated) user = updated;
    }

    // If existing user has no fullName and Google provides one, update it
    if (!user.fullName && googleUser.fullName) {
      const updated = await userStore.update(user.id, {
        fullName: googleUser.fullName.trim(),
      });
      if (updated) user = updated;
    }

    // Clean up any pending registration for this email
    await pendingRegistrationStore.delete(rawEmail).catch(() => {});

    // Sign session tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
    };

    const token = signAccessToken(payload);
    const { token: refreshToken } = generateRefreshToken();

    return {
      success: true,
      status: 200,
      message: `Welcome back, ${user.fullName || "User"}! Signed in with Google.`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
        },
        token,
        refreshToken,
        isNewUser: false,
      },
    };
  }

  // 2. New User Registration via Google
  // Clean up any pending incomplete registration sessions
  await pendingRegistrationStore.delete(rawEmail).catch(() => {});

  // Generate strong random password hash so user account is protected
  const randomSecret = crypto.randomBytes(32).toString("hex");
  const passwordHash = await hashPassword(randomSecret);

  const fallbackName =
    googleUser.fullName?.trim() ||
    rawEmail
      .split("@")[0]
      ?.replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Restaurant Owner";

  const newUser = await userStore.create({
    email: rawEmail,
    passwordHash,
    fullName: fallbackName,
    role: "RESTAURANT_OWNER",
    isVerified: true, // Google accounts are pre-verified!
  });

  const payload: TokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    fullName: newUser.fullName,
    phone: newUser.phone,
  };

  const token = signAccessToken(payload);
  const { token: refreshToken } = generateRefreshToken();

  return {
    success: true,
    status: 201,
    message: `Account created successfully with Google! Welcome to Menuly, ${fallbackName}.`,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        phone: newUser.phone,
      },
      token,
      refreshToken,
      isNewUser: true,
    },
  };
}

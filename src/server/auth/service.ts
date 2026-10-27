import { userStore, otpStore, type StoredUser } from "./store";
import { prisma } from "../db";
import {
  hashPassword,
  comparePassword,
  generateNumericOtp,
  hashOtp,
  compareOtp,
  signAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  type TokenPayload,
} from "./security";
import { sendOtpEmail } from "../email/mailer";
import { sendWhatsAppOtp } from "../whatsapp/sender";
import { checkRateLimit, AuthRateLimits } from "./rate-limiter";
import { sanitizePublicRole, type UserRole } from "./rbac";

export interface ServiceResult<T = unknown> {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  error?: string;
}

const OTP_EXPIRY_MINUTES = Number(process.env["OTP_EXPIRY_MINUTES"]) || 10;
const OTP_MAX_ATTEMPTS = Number(process.env["OTP_MAX_ATTEMPTS"]) || 5;

/**
 * Security guard: Never expose devOtp in production under any circumstance.
 * Only allowed in explicit test suites or local development environments lacking SMTP.
 */
function shouldExposeDevOtp(): boolean {
  if (process.env["NODE_ENV"] === "production") return false;
  return !process.env["SMTP_PASS"] || process.env["NODE_ENV"] === "test";
}

/**
 * 0. FAST EMAIL AVAILABILITY & VERIFICATION STATUS CHECK
 * Ultra-fast sub-millisecond check to verify if an email is already registered before user submits form.
 */
export async function checkEmailAvailability(email: string): Promise<
  ServiceResult<{
    email: string;
    exists: boolean;
    isVerified: boolean;
    suggestLogin: boolean;
  }>
> {
  const normalized = (email || "").toLowerCase().trim();
  if (!normalized || !normalized.includes("@") || !normalized.includes(".")) {
    return {
      success: false,
      status: 400,
      error: "Please enter a valid email address.",
      data: { email: normalized, exists: false, isVerified: false, suggestLogin: false },
    };
  }

  const check = await userStore.checkEmailExists(normalized);
  const exists = Boolean(check && check.exists);
  const isVerified = Boolean(check && check.isVerified);

  return {
    success: true,
    status: 200,
    message: isVerified
      ? "An account with this email is already registered."
      : exists
        ? "Account exists but is pending email verification."
        : "Email is available.",
    data: {
      email: normalized,
      exists,
      isVerified,
      suggestLogin: isVerified,
    },
  };
}

/**
 * 1. SIGNUP
 * Registers a new restaurant owner (unverified) and dispatches a branded OTP email.
 * Enforces: Role is ALWAYS RESTAURANT_OWNER. Public signup can NEVER assign SUPER_ADMIN.
 * Performance: Instant pre-check on indexed email before expensive bcrypt hashing.
 */
export async function signupUser(params: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  clientIp?: string;
}): Promise<ServiceResult<{ email: string; requiresVerification: boolean; devOtp?: string; code?: string }>> {
  const { email, password, fullName, phone, clientIp = "global" } = params;

  if (!email || !email.includes("@")) {
    return { success: false, status: 400, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, status: 400, error: "Password must be at least 6 characters long." };
  }

  // Rate Limiting
  const rate = checkRateLimit(`signup:${clientIp}`, AuthRateLimits.SIGNUP);
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Too many signup attempts. Please try again in ${rate.resetInSeconds} seconds.`,
    };
  }

  const normalized = email.toLowerCase().trim();

  // 1. FAST PRE-CHECK: Check indexed cache/db FIRST before heavy bcrypt operations
  const quickStatus = await userStore.checkEmailExists(normalized);
  if (quickStatus && quickStatus.exists && quickStatus.isVerified) {
    return {
      success: false,
      status: 409,
      error: "An account with this email already exists. Please log in instead.",
      data: {
        email: normalized,
        requiresVerification: false,
        code: "EMAIL_ALREADY_EXISTS",
      },
    };
  }

  // 2. PARALLEL CRYPTO: Hash password and generate/hash OTP concurrently to cut latency in half
  const rawOtp = generateNumericOtp();
  const [passwordHash, otpHash] = await Promise.all([
    hashPassword(password),
    hashOtp(rawOtp),
  ]);

  let user: StoredUser;
  const existingUser = quickStatus?.exists ? await userStore.findByEmail(normalized) : null;

  if (existingUser && !existingUser.isVerified) {
    // Update password hash for unverified user re-attempting signup
    const updated = await userStore.update(existingUser.id, {
      passwordHash,
      fullName: fullName || existingUser.fullName,
      ...(phone ? { phone: phone.trim() } : {}),
    });
    user = updated || existingUser;
  } else {
    // Strictly sanitize role to RESTAURANT_OWNER
    const safeRole = sanitizePublicRole();
    user = await userStore.create({
      email: normalized,
      passwordHash,
      ...(fullName ? { fullName } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      role: safeRole,
      isVerified: false,
    });
  }

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await otpStore.saveOtp({
    email: normalized,
    otpHash,
    type: "SIGNUP",
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  // Simultaneously dispatch via Email and WhatsApp (if phone provided)
  await sendOtpEmail(normalized, rawOtp, "SIGNUP", OTP_EXPIRY_MINUTES);

  if (phone) {
    await sendWhatsAppOtp(phone, rawOtp, "SIGNUP").catch((e) => {
      console.warn("[WhatsApp Dispatch Warning]:", e);
    });
  }

  const deliveryMsg = phone
    ? `Verification code sent to ${normalized} and your WhatsApp number.`
    : `Verification code sent to ${normalized}. Please check your email.`;

  return {
    success: true,
    status: 200,
    message: deliveryMsg,
    data: {
      email: normalized,
      requiresVerification: true,
      ...(shouldExposeDevOtp() ? { devOtp: rawOtp } : {}),
    },
  };
}

/**
 * 2. VERIFY OTP
 * Validates the 6-digit OTP code against the bcrypt hash and activates the user account.
 */
export async function verifyUserOtp(params: {
  email: string;
  otp: string;
  type?: "SIGNUP" | "PASSWORD_RESET" | "LOGIN";
  clientIp?: string;
}): Promise<
  ServiceResult<{
    user?: { id: string; email: string; role: UserRole; fullName: string | null };
    token?: string;
    refreshToken?: string;
    verified?: boolean;
  }>
> {
  const { email, otp, type = "SIGNUP", clientIp = "global" } = params;

  if (!email || !otp || otp.trim().length !== 6) {
    return { success: false, status: 400, error: "Please enter a valid 6-digit verification code." };
  }

  const normalized = email.toLowerCase().trim();

  // Rate Limiting on verification attempts
  const rate = checkRateLimit(`verify:${normalized}:${clientIp}`, AuthRateLimits.VERIFY_OTP);
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Too many failed verification attempts. Please wait ${rate.resetInSeconds} seconds.`,
    };
  }

  const activeOtp = await otpStore.findLatestValidOtp(normalized, type);
  if (!activeOtp) {
    return {
      success: false,
      status: 400,
      error: "Verification code has expired or was not requested. Please request a new code.",
    };
  }

  if (activeOtp.attempts >= activeOtp.maxAttempts) {
    return {
      success: false,
      status: 400,
      error: "Maximum verification attempts exceeded. Please request a new code.",
    };
  }

  // Compare candidate code with stored bcrypt hash
  const isValid = await compareOtp(otp.trim(), activeOtp.otpHash);
  if (!isValid) {
    const attempts = await otpStore.incrementAttempts(activeOtp.id);
    const remaining = Math.max(0, activeOtp.maxAttempts - attempts);
    return {
      success: false,
      status: 400,
      error: remaining > 0
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : "Verification code locked due to too many failed attempts. Please request a new code.",
    };
  }

  // Mark OTP as used
  await otpStore.markVerified(activeOtp.id);

  if (type === "SIGNUP") {
    const user = await userStore.findByEmail(normalized);
    if (!user) {
      return { success: false, status: 404, error: "User account not found." };
    }

    // Activate user
    const updatedUser = await userStore.update(user.id, { isVerified: true });
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: updatedUser?.role || user.role,
      fullName: user.fullName,
    };

    const token = signAccessToken(payload);
    const { token: refreshToken } = generateRefreshToken();

    return {
      success: true,
      status: 200,
      message: "Email verified successfully! Welcome to Menuly.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: updatedUser?.role || user.role,
          fullName: user.fullName,
        },
        token,
        refreshToken,
      },
    };
  }

  // For PASSWORD_RESET, returning verified flag so reset-password endpoint can proceed
  return {
    success: true,
    status: 200,
    message: "Verification code confirmed.",
    data: { verified: true },
  };
}

/**
 * 2b. SEND PHONE VERIFICATION OTP (Step 2 of Signup)
 * Dispatches a 6-digit verification code to user's WhatsApp to link mobile number.
 */
export async function sendPhoneVerificationOtp(params: {
  email: string;
  phone: string;
  clientIp?: string;
}): Promise<ServiceResult<{ phone: string; devOtp?: string }>> {
  const { email, phone, clientIp = "global" } = params;
  const normalized = email.toLowerCase().trim();
  const cleanDigits = phone.replace(/\D/g, "");

  if (!cleanDigits || cleanDigits.length < 10) {
    return { success: false, status: 400, error: "Please enter a valid 10-digit mobile number." };
  }

  const rate = checkRateLimit(`phone-otp:${cleanDigits}:${clientIp}`, {
    windowMs: 60 * 1000,
    max: 3,
  });
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Please wait ${rate.resetInSeconds} seconds before requesting another code.`,
    };
  }

  const user = await userStore.findByEmail(normalized);
  if (!user) {
    return { success: false, status: 404, error: "User account not found." };
  }

  const rawOtp = generateNumericOtp();
  const otpHash = await hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await otpStore.saveOtp({
    email: normalized,
    otpHash,
    type: "SIGNUP",
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

  // Save phone number to user
  await userStore.update(user.id, { phone: formattedPhone });

  // Dispatch via WhatsApp bot
  await sendWhatsAppOtp(cleanDigits, rawOtp, "SIGNUP").catch((e) => {
    console.warn("[WhatsApp Dispatch Error]:", e);
  });

  return {
    success: true,
    status: 200,
    message: `Verification code sent to WhatsApp: ${formattedPhone}`,
    data: {
      phone: formattedPhone,
      ...(shouldExposeDevOtp() ? { devOtp: rawOtp } : {}),
    },
  };
}

/**
 * 2c. VERIFY PHONE VERIFICATION OTP (Step 2 of Signup)
 * Validates the WhatsApp OTP and activates the phone link.
 */
export async function verifyPhoneVerificationOtp(params: {
  email: string;
  phone: string;
  otp: string;
}): Promise<
  ServiceResult<{
    user?: { id: string; email: string; role: UserRole; fullName: string | null; phone?: string | null };
    token?: string;
    refreshToken?: string;
  }>
> {
  const { email, phone, otp } = params;
  const normalized = email.toLowerCase().trim();
  const cleanDigits = phone.replace(/\D/g, "");
  const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

  const res = await verifyUserOtp({
    email: normalized,
    otp,
    type: "SIGNUP",
  });

  if (!res.success) {
    return res;
  }

  const user = await userStore.findByEmail(normalized);
  if (user) {
    const updatedUser = await userStore.update(user.id, { phone: formattedPhone });
    return {
      success: true,
      status: 200,
      message: "Phone verified and linked successfully.",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          fullName: updatedUser.fullName,
          phone: updatedUser.phone,
        },
        token: res.data?.token,
        refreshToken: res.data?.refreshToken,
      },
    };
  }

  return res;
}

/**
 * 3. RESEND OTP
 * Dispatches a new OTP with a 60-second cooldown protection.
 */
export async function resendUserOtp(params: {
  email: string;
  type?: "SIGNUP" | "PASSWORD_RESET" | "LOGIN";
  clientIp?: string;
}): Promise<ServiceResult<{ email: string }>> {
  const { email, type = "SIGNUP", clientIp = "global" } = params;

  if (!email || !email.includes("@")) {
    return { success: false, status: 400, error: "Please provide a valid email." };
  }

  const normalized = email.toLowerCase().trim();

  // 60-second cooldown rate limit per email
  const rate = checkRateLimit(`resend:${normalized}`, {
    windowMs: 60 * 1000,
    max: 1,
  });
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Please wait ${rate.resetInSeconds} seconds before requesting another code.`,
    };
  }

  const rawOtp = generateNumericOtp();
  const otpHash = await hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await otpStore.saveOtp({
    email: normalized,
    otpHash,
    type,
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  await sendOtpEmail(normalized, rawOtp, type, OTP_EXPIRY_MINUTES);

  const existingUser = await userStore.findByEmail(normalized);
  if (existingUser?.phone) {
    await sendWhatsAppOtp(existingUser.phone, rawOtp, type).catch((e) => {
      console.warn("[WhatsApp Dispatch Warning]:", e);
    });
  }

  const resendMsg = existingUser?.phone
    ? `A new verification code has been sent to ${normalized} and your WhatsApp number.`
    : `A new verification code has been sent to ${normalized}.`;

  return {
    success: true,
    status: 200,
    message: resendMsg,
    data: {
      email: normalized,
      ...(shouldExposeDevOtp() ? { devOtp: rawOtp } : {}),
    },
  };
}

/**
 * 4. LOGIN
 * Authenticates user credentials. If email is unverified, dispatches a fresh OTP and halts.
 */
export async function loginUser(params: {
  email?: string;
  identifier?: string;
  password: string;
  clientIp?: string;
}): Promise<
  ServiceResult<{
    user?: { id: string; email: string; role: UserRole; fullName: string | null };
    token?: string;
    refreshToken?: string;
    requiresVerification?: boolean;
    email?: string;
    devOtp?: string;
  }>
> {
  const { email, identifier, password, clientIp = "global" } = params;
  const lookupInput = (identifier || email || "").trim();

  if (!lookupInput || !password) {
    return { success: false, status: 400, error: "Please enter your email or mobile number, and password." };
  }

  // Rate Limiting to prevent brute-force password guessing
  const rate = checkRateLimit(`login:${lookupInput.toLowerCase()}:${clientIp}`, AuthRateLimits.LOGIN);
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Too many failed login attempts. Please wait ${rate.resetInSeconds} seconds.`,
    };
  }

  const user = await userStore.findByIdentifier(lookupInput);
  if (!user) {
    return { success: false, status: 401, error: "Invalid email/phone or password." };
  }

  const passwordMatch = await comparePassword(password, user.passwordHash);
  if (!passwordMatch) {
    return { success: false, status: 401, error: "Invalid email/phone or password." };
  }

  // If email is not yet verified, send fresh OTP and prompt verification
  if (!user.isVerified) {
    const rawOtp = generateNumericOtp();
    const otpHash = await hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await otpStore.saveOtp({
      email: user.email,
      otpHash,
      type: "SIGNUP",
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    await sendOtpEmail(user.email, rawOtp, "SIGNUP", OTP_EXPIRY_MINUTES);

    if (user.phone) {
      await sendWhatsAppOtp(user.phone, rawOtp, "SIGNUP").catch((e) => {
        console.warn("[WhatsApp Dispatch Warning]:", e);
      });
    }

    return {
      success: false,
      status: 403,
      message: "Your account is not verified yet. We just sent a verification code to your email and WhatsApp.",
      data: {
        requiresVerification: true,
        email: user.email,
        ...(shouldExposeDevOtp() ? { devOtp: rawOtp } : {}),
      },
    };
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  const token = signAccessToken(payload);
  const { token: refreshToken } = generateRefreshToken();

  return {
    success: true,
    status: 200,
    message: "Logged in successfully.",
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      token,
      refreshToken,
    },
  };
}

/**
 * 5. FORGOT PASSWORD
 * Sends a password reset OTP to the registered email.
 */
export async function forgotPassword(params: {
  email?: string;
  identifier?: string;
  clientIp?: string;
}): Promise<ServiceResult<{ email: string; phone?: string; devOtp?: string }>> {
  const { email, identifier, clientIp = "global" } = params;
  const lookupInput = (identifier || email || "").trim();

  if (!lookupInput) {
    return { success: false, status: 400, error: "Please enter your registered email address or mobile number." };
  }

  // Rate Limiting
  const rate = checkRateLimit(`forgot:${lookupInput.toLowerCase()}:${clientIp}`, AuthRateLimits.FORGOT_PASSWORD);
  if (!rate.allowed) {
    return {
      success: false,
      status: 429,
      error: `Too many requests. Please wait ${rate.resetInSeconds} seconds.`,
    };
  }

  const user = await userStore.findByIdentifier(lookupInput);

  let devOtp: string | undefined;
  let targetEmail = lookupInput.includes("@") ? lookupInput.toLowerCase() : (user?.email || "");

  if (user) {
    targetEmail = user.email;
    const rawOtp = generateNumericOtp();
    const otpHash = await hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await otpStore.saveOtp({
      email: user.email,
      otpHash,
      type: "PASSWORD_RESET",
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    await sendOtpEmail(user.email, rawOtp, "PASSWORD_RESET", OTP_EXPIRY_MINUTES);

    if (user.phone) {
      await sendWhatsAppOtp(user.phone, rawOtp, "PASSWORD_RESET").catch((e) => {
        console.warn("[WhatsApp Dispatch Warning]:", e);
      });
    }

    if (shouldExposeDevOtp()) {
      devOtp = rawOtp;
    }
  }

  const deliveryMsg = user?.phone
    ? "Password reset code sent to your registered email and WhatsApp."
    : "If this account is registered, a password reset code has been sent.";

  return {
    success: true,
    status: 200,
    message: deliveryMsg,
    data: {
      email: targetEmail,
      ...(user?.phone ? { phone: user.phone } : {}),
      ...(devOtp ? { devOtp } : {}),
    },
  };
}

/**
 * 6. RESET PASSWORD
 * Updates the user's password once the OTP has been verified.
 */
export async function resetPassword(params: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<ServiceResult> {
  const { email, otp, newPassword } = params;

  if (!email || !otp || !newPassword || newPassword.length < 6) {
    return {
      success: false,
      status: 400,
      error: "Please enter all required fields. New password must be at least 6 characters.",
    };
  }

  const normalized = email.toLowerCase().trim();

  // Find the OTP requested for PASSWORD_RESET for this email within expiration
  const activeOtp = await otpStore.findLatestPasswordResetOtp(normalized);

  if (!activeOtp) {
    return {
      success: false,
      status: 400,
      error: "Verification code has expired or was not requested. Please request a new code.",
    };
  }

  // If activeOtp was NOT marked verified in the previous step, compare now
  if (!activeOtp.verified) {
    const isValid = await compareOtp(otp.trim(), activeOtp.otpHash);
    if (!isValid) {
      return {
        success: false,
        status: 400,
        error: "Incorrect verification code.",
      };
    }
  }

  const user = await userStore.findByEmail(normalized);
  if (!user) {
    return { success: false, status: 404, error: "User not found." };
  }

  const newHash = await hashPassword(newPassword);
  await userStore.update(user.id, { passwordHash: newHash });

  // Invalidate OTP so it cannot be used again
  await otpStore.invalidateOtp(activeOtp.id);

  return {
    success: true,
    status: 200,
    message: "Password reset successfully. You can now log in with your new password.",
  };
}

/**
 * 7. GET CURRENT USER (from Bearer Token)
 */
export async function getCurrentUser(
  token?: string | null
): Promise<ServiceResult<{ user: TokenPayload; token?: string }>> {
  if (!token) {
    return { success: false, status: 401, error: "Not authenticated. Missing token." };
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return { success: false, status: 401, error: "Invalid or expired token." };
  }

  const user = await userStore.findById(payload.userId);
  if (!user) {
    return { success: false, status: 404, error: "User no longer exists." };
  }

  const freshPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };
  const freshToken = signAccessToken(freshPayload);

  return {
    success: true,
    status: 200,
    data: {
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      token: freshToken,
    },
  };
}

/**
 * 8. UPDATE USER PROFILE
 * Updates full name, email, and linked restaurant details.
 */
export async function updateUserProfile(params: {
  userId: string;
  fullName?: string;
  email?: string;
  restaurantName?: string;
  phone?: string;
  whatsapp?: string;
  logoUrl?: string | null;
}): Promise<ServiceResult<{ user: TokenPayload; token: string }>> {
  const { userId, fullName, email, restaurantName, phone, whatsapp, logoUrl } = params;

  const user = await userStore.findById(userId);
  if (!user) {
    return { success: false, status: 404, error: "User account not found." };
  }

  let normalizedEmail = user.email;
  if (email && email.trim() && email.trim().toLowerCase() !== user.email) {
    normalizedEmail = email.trim().toLowerCase();
    const existing = await userStore.findByEmail(normalizedEmail);
    if (existing && existing.id !== userId) {
      return {
        success: false,
        status: 400,
        error: "This email address is already in use by another account.",
      };
    }
  }

  const updatedUser = await userStore.update(userId, {
    fullName: fullName !== undefined ? fullName.trim() : user.fullName,
    email: normalizedEmail,
    phone: phone !== undefined ? phone.trim() : user.phone,
  });

  if (Boolean(process.env["DATABASE_URL"])) {
    try {
      const rest = await prisma.restaurant.findFirst({ where: { ownerId: userId } });
      if (rest) {
        await prisma.restaurant.update({
          where: { id: rest.id },
          data: {
            ...(restaurantName ? { name: restaurantName.trim() } : {}),
            ...(phone !== undefined ? { phone: phone.trim() } : {}),
            ...(whatsapp !== undefined ? { whatsapp: whatsapp.trim() } : {}),
            ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
          },
        });
      }
    } catch {
      // fallback
    }
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: normalizedEmail,
    role: updatedUser?.role || user.role,
    fullName: updatedUser?.fullName || user.fullName,
  };
  const token = signAccessToken(payload);

  return {
    success: true,
    status: 200,
    message: "Profile updated successfully.",
    data: { user: payload, token },
  };
}

/**
 * 9. CHANGE USER PASSWORD
 * Securely changes the user password verifying the current password first.
 */
export async function changeUserPassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<ServiceResult> {
  const { userId, currentPassword, newPassword } = params;

  if (!currentPassword || !newPassword) {
    return { success: false, status: 400, error: "Please enter both your current and new password." };
  }

  if (newPassword.length < 6) {
    return { success: false, status: 400, error: "New password must be at least 6 characters long." };
  }

  const user = await userStore.findById(userId);
  if (!user) {
    return { success: false, status: 404, error: "User account not found." };
  }

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) {
    return { success: false, status: 400, error: "Current password is incorrect." };
  }

  const newHash = await hashPassword(newPassword);
  await userStore.update(userId, { passwordHash: newHash });

  return {
    success: true,
    status: 200,
    message: "Password changed successfully.",
  };
}

/**
 * 10. SEED SUPER ADMIN
 * Safe script helper to create the initial Super Admin account without risking password overwrite.
 */
export async function seedSuperAdmin(
  adminEmail = process.env["SUPER_ADMIN_EMAIL"] || "menulyofficial@gmail.com",
  adminPassword = process.env["SUPER_ADMIN_PASSWORD"] || "AdminPassword123!",
  forceReset = false
): Promise<StoredUser> {
  const normalized = adminEmail.toLowerCase().trim();
  const existing = await userStore.findByEmail(normalized);

  if (existing) {
    // If account already exists and is already verified as SUPER_ADMIN, protect the password!
    if (existing.role === "SUPER_ADMIN" && !forceReset) {
      console.log(`[Super Admin] Account ${normalized} is already initialized as SUPER_ADMIN. Existing credentials preserved.`);
      return existing;
    }

    const passwordHash = forceReset ? await hashPassword(adminPassword) : (existing.passwordHash || await hashPassword(adminPassword));
    const updated = await userStore.update(existing.id, {
      role: "SUPER_ADMIN",
      passwordHash,
      isVerified: true,
      fullName: existing.fullName || "Super Admin",
    });
    console.log(`[Super Admin] Preserved and verified super admin account: ${normalized}`);
    return updated || existing;
  }

  const passwordHash = await hashPassword(adminPassword);
  const created = await userStore.create({
    email: normalized,
    passwordHash,
    fullName: "Super Admin",
    role: "SUPER_ADMIN",
    isVerified: true,
  });
  console.log(`[Super Admin] Created new super admin: ${normalized} (Role: SUPER_ADMIN)`);
  return created;
}

import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  generateNumericOtp,
  hashOtp,
  compareOtp,
  signAccessToken,
  verifyAccessToken,
} from "../server/auth/security";
import { checkRateLimit } from "../server/auth/rate-limiter";
import { hasRole, sanitizePublicRole } from "../server/auth/rbac";
import { renderOtpEmail } from "../server/email/templates";
import { signupUser, verifyUserOtp, loginUser } from "../server/auth/service";

describe("Custom Authentication & Security Suite", () => {
  it("securely hashes and verifies passwords", async () => {
    const raw = "SuperSecretPassword123!";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    expect(await comparePassword(raw, hash)).toBe(true);
    expect(await comparePassword("WrongPassword!", hash)).toBe(false);
  });

  it("generates cryptographically secure 6-digit OTP and hashes it", async () => {
    const otp = generateNumericOtp();
    expect(otp).toHaveLength(6);
    expect(Number(otp)).toBeGreaterThanOrEqual(100000);
    expect(Number(otp)).toBeLessThanOrEqual(999999);

    const otpHash = await hashOtp(otp);
    expect(await compareOtp(otp, otpHash)).toBe(true);
    expect(await compareOtp("999999", otpHash)).toBe(false);
  });

  it("generates and verifies valid JWT tokens", () => {
    const payload = {
      userId: "usr-test-123",
      email: "chef@royalspice.in",
      role: "RESTAURANT_OWNER" as const,
      fullName: "Chef Rajesh",
    };
    const token = signAccessToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyAccessToken(token);
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it("strictly enforces public role sanitization to RESTAURANT_OWNER", () => {
    expect(sanitizePublicRole("SUPER_ADMIN")).toBe("RESTAURANT_OWNER");
    expect(sanitizePublicRole("admin")).toBe("RESTAURANT_OWNER");
    expect(sanitizePublicRole(undefined)).toBe("RESTAURANT_OWNER");
  });

  it("enforces sliding-window rate limits", () => {
    const testKey = `test-limit-${Date.now()}`;
    const opts = { windowMs: 5000, max: 3 };

    expect(checkRateLimit(testKey, opts).allowed).toBe(true);
    expect(checkRateLimit(testKey, opts).allowed).toBe(true);
    expect(checkRateLimit(testKey, opts).allowed).toBe(true);
    // 4th attempt should be blocked
    expect(checkRateLimit(testKey, opts).allowed).toBe(false);
  });

  it("renders branded Menuly Pure Veg HTML email templates", () => {
    const email = renderOtpEmail({
      otp: "582910",
      email: "diner@example.com",
      type: "SIGNUP",
      expiresInMinutes: 10,
    });

    expect(email.subject).toContain("582910");
    expect(email.html).toContain("100% PURE VEG PLATFORM");
    expect(email.html).toContain("582910");
    expect(email.html).toContain("menulyoffcial@gmail.com");
  });

  it(
    "completes full signup -> verify -> login flow",
    async () => {
      const testEmail = `chef-${Date.now()}@testrestaurant.in`;
      const password = "KitchenPassword123!";

      // 1. Signup
      const signupRes = await signupUser({
        email: testEmail,
        password,
        fullName: "Chef Test",
      });
      expect(signupRes.success).toBe(true);
      expect(signupRes.data?.requiresVerification).toBe(true);

      // 2. Unverified login attempt should require verification
      const unverifiedLogin = await loginUser({ email: testEmail, password });
      expect(unverifiedLogin.success).toBe(false);
      expect(unverifiedLogin.data?.requiresVerification).toBe(true);
    },
    15000
  );
});

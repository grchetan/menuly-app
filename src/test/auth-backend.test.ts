import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../server/db";
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
import {
  checkEmailAvailability,
  signupUser,
  verifyUserOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserProfile,
  changeUserPassword,
} from "../server/auth/service";

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

  it("renders professional Menuly HTML email templates", () => {
    const email = renderOtpEmail({
      otp: "582910",
      email: "diner@example.com",
      type: "SIGNUP",
      expiresInMinutes: 10,
    });

    expect(email.subject).toBe("Verify your email address for Menuly");
    expect(email.subject).not.toContain("582910");
    expect(email.subject).not.toContain("[Menuly]");
    expect(email.html).toContain("VERIFICATION CODE");
    expect(email.html).toContain("582910");
    expect(email.html).toContain("menulyofficial@gmail.com");
  });

  it("checks email availability in real-time and fast-fails on duplicates", async () => {
    const uniqueEmail = `avail-${Date.now()}@kitchencheck.in`;

    // 1. Unregistered email should be available
    const freshCheck = await checkEmailAvailability(uniqueEmail);
    expect(freshCheck.success).toBe(true);
    expect(freshCheck.data?.exists).toBe(false);
    expect(freshCheck.data?.suggestLogin).toBe(false);

    // 2. Signup and verify account
    const signupRes = await signupUser({
      email: uniqueEmail,
      password: "GoodPassword123!",
      fullName: "Chef Availability",
    });
    expect(signupRes.success).toBe(true);
    const otp = signupRes.data?.devOtp;
    expect(otp).toBeTruthy();
    if (otp) {
      await verifyUserOtp({ email: uniqueEmail, otp, type: "SIGNUP" });
    }

    // 3. Fast availability check now flags email as existing and suggests login
    const existingCheck = await checkEmailAvailability(uniqueEmail);
    expect(existingCheck.success).toBe(true);
    expect(existingCheck.data?.exists).toBe(true);
    expect(existingCheck.data?.isVerified).toBe(true);
    expect(existingCheck.data?.suggestLogin).toBe(true);

    // 4. Duplicate signup attempt is instantly rejected with 409
    const dupSignup = await signupUser({
      email: uniqueEmail,
      password: "AnotherPassword123!",
      fullName: "Chef Duplicate",
    });
    expect(dupSignup.success).toBe(false);
    expect(dupSignup.status).toBe(409);
    expect(dupSignup.error).toContain("already exists");
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

      // 3. Verify OTP (using latest OTP from unverified login prompt)
      const otp = unverifiedLogin.data?.devOtp || signupRes.data?.devOtp;
      expect(otp).toBeTruthy();
      if (otp) {
        const verifyRes = await verifyUserOtp({
          email: testEmail,
          otp,
          type: "SIGNUP",
        });
        expect(verifyRes.success).toBe(true);

        // 4. Login after verification
        const verifiedLogin = await loginUser({ email: testEmail, password });
        expect(verifiedLogin.success).toBe(true);
        expect(verifiedLogin.data?.token).toBeTruthy();

        // 5. Test Forgot Password -> Reset Flow (Prevents regression of double verification bug)
        const forgotRes = await forgotPassword({ email: testEmail });
        expect(forgotRes.success).toBe(true);
        const resetOtp = forgotRes.data?.devOtp;

        if (resetOtp) {
          // Frontend Step 1: verify-otp
          const verifyResetOtpRes = await verifyUserOtp({
            email: testEmail,
            otp: resetOtp,
            type: "PASSWORD_RESET",
          });
          expect(verifyResetOtpRes.success).toBe(true);

          // Frontend Step 2: reset-password with the verified OTP
          const newPassword = "BrandNewPassword456!";
          const resetRes = await resetPassword({
            email: testEmail,
            otp: resetOtp,
            newPassword,
          });
          expect(resetRes.success).toBe(true);

          // Verify user can now log in with the new password
          const newLogin = await loginUser({ email: testEmail, password: newPassword });
          expect(newLogin.success).toBe(true);

          // Old password should fail
          const oldLogin = await loginUser({ email: testEmail, password });
          expect(oldLogin.success).toBe(false);
        }
      }
    },
    45000
  );

  it("updates user profile and changes password securely", async () => {
    const testEmail = `owner-${Date.now()}@restaurant.com`;
    const initialPassword = "InitialPassword123!";
    const signupRes = await signupUser({ email: testEmail, password: initialPassword, fullName: "Chef Initial" });
    const otp = signupRes.data?.devOtp;
    if (otp) {
      await verifyUserOtp({ email: testEmail, otp, type: "SIGNUP" });
    }
    const loginRes = await loginUser({ email: testEmail, password: initialPassword });
    expect(loginRes.success).toBe(true);
    const userId = loginRes.data?.user?.id;
    expect(userId).toBeTruthy();

    if (userId) {
      // 1. Update Profile
      const updateRes = await updateUserProfile({
        userId,
        fullName: "Chef Updated Name",
        phone: "+91 99999 88888",
      });
      expect(updateRes.success).toBe(true);
      expect(updateRes.data?.user?.fullName).toBe("Chef Updated Name");
      expect(updateRes.data?.token).toBeTruthy();

      // 2. Change Password
      const changedPwRes = await changeUserPassword({
        userId,
        currentPassword: initialPassword,
        newPassword: "UpdatedSecretPassword99!",
      });
      expect(changedPwRes.success).toBe(true);

      // Verify old password fails
      const oldLogin = await loginUser({ email: testEmail, password: initialPassword });
      expect(oldLogin.success).toBe(false);

      // Verify new password succeeds
      const newLogin = await loginUser({ email: testEmail, password: "UpdatedSecretPassword99!" });
      expect(newLogin.success).toBe(true);
    }
  }, 45000);

  afterAll(async () => {
    try {
      const testUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { endsWith: "@testrestaurant.in" } },
            { email: { endsWith: "@restaurant.com" } },
          ],
        },
      });
      for (const tu of testUsers) {
        await prisma.restaurant.deleteMany({ where: { ownerId: tu.id } });
        await prisma.user.delete({ where: { id: tu.id } });
      }
    } catch {
      // ignore cleanup errors in test
    }
  });
});

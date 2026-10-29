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
  sendPhoneVerificationOtp,
  verifyPhoneVerificationOtp,
} from "../server/auth/service";
import { userStore } from "../server/auth/store";

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

  it("supports 2-step onboarding (email OTP -> phone WhatsApp OTP), login via phone, and forgot-password via phone", async () => {
    const testEmail = `step2-${Date.now()}@testrestaurant.in`;
    const testPhone = `982${Date.now().toString().slice(-7)}`;
    const testPassword = "PasswordPhone123!";

    // 1. Step 1: Signup with Email
    const signupRes = await signupUser({
      email: testEmail,
      password: testPassword,
      fullName: "Chef TwoStep",
    });
    expect(signupRes.success).toBe(true);
    expect(signupRes.data?.devOtp).toBeTruthy();

    // Verify Step 1 Email OTP
    const verifyEmailRes = await verifyUserOtp({
      email: testEmail,
      otp: signupRes.data!.devOtp!,
      type: "SIGNUP",
    });
    expect(verifyEmailRes.success).toBe(true);
    expect(verifyEmailRes.data?.user?.email).toBe(testEmail);

    // 2. Step 2: Send WhatsApp OTP for Phone linking
    const sendPhoneRes = await sendPhoneVerificationOtp({
      email: testEmail,
      phone: testPhone,
    });
    expect(sendPhoneRes.success).toBe(true);
    expect(sendPhoneRes.data?.devOtp).toBeTruthy();

    // Verify Step 2 WhatsApp OTP
    const verifyPhoneRes = await verifyPhoneVerificationOtp({
      email: testEmail,
      phone: testPhone,
      otp: sendPhoneRes.data!.devOtp!,
    });
    expect(verifyPhoneRes.success).toBe(true);
    expect(verifyPhoneRes.data?.user?.phone).toContain(testPhone);

    // 3. Login using Phone Number Identifier
    const loginByPhoneRes = await loginUser({
      identifier: testPhone,
      password: testPassword,
    });
    expect(loginByPhoneRes.success).toBe(true);
    expect(loginByPhoneRes.data?.user?.email).toBe(testEmail);

    // 4. Login using +91 formatted phone
    const loginByFullPhoneRes = await loginUser({
      identifier: `+91${testPhone}`,
      password: testPassword,
    });
    expect(loginByFullPhoneRes.success).toBe(true);

    // 5. Forgot Password using Phone Number Identifier -> Dispatches to WhatsApp, not email
    const forgotRes = await forgotPassword({
      identifier: testPhone,
    });
    expect(forgotRes.success).toBe(true);
    expect(forgotRes.data?.email).toBe(testEmail);
    expect(forgotRes.data?.channel).toBe("phone");
    expect(forgotRes.data?.phone).toBe(`+91${testPhone}`);
    expect(forgotRes.message).toContain("WhatsApp");
    expect(forgotRes.data?.devOtp).toBeTruthy();
  }, 45000);

  it("handles account suspension (ban): blocks login and forgot-password with suspension message, and unbans cleanly", async () => {
    const banEmail = `ban-${Date.now()}@testrestaurant.in`;
    const password = "BanTestPassword123!";
    const signup = await signupUser({ email: banEmail, password, fullName: "Suspended Owner", clientIp: `ban-ip-${Date.now()}` });
    expect(signup.success).toBe(true);
    const otp = signup.data?.devOtp;
    expect(otp).toBeTruthy();
    await verifyUserOtp({ email: banEmail, otp: otp!, type: "SIGNUP" });

    const user = await userStore.findByEmail(banEmail);
    expect(user).toBeTruthy();

    // 1. Ban the user with a custom reason
    const customReason = "Account suspended due to policy violation.";
    await userStore.setBan(user!.id, true, customReason);

    // 2. Attempt login -> Must fail with 403 and the suspension message
    const loginAttempt = await loginUser({ email: banEmail, password, clientIp: `ban-login-ip-${Date.now()}` });
    expect(loginAttempt.success).toBe(false);
    expect(loginAttempt.status).toBe(403);
    expect(loginAttempt.error).toBe(customReason);

    // 3. Attempt forgot password -> Must fail with 403
    const forgotAttempt = await forgotPassword({ email: banEmail, clientIp: `ban-forgot-ip-${Date.now()}` });
    expect(forgotAttempt.success).toBe(false);
    expect(forgotAttempt.status).toBe(403);
    expect(forgotAttempt.error).toBe(customReason);

    // 4. Unban user -> Login must succeed again
    await userStore.setBan(user!.id, false);
    const unbannedLogin = await loginUser({ email: banEmail, password, clientIp: `unban-login-ip-${Date.now()}` });
    expect(unbannedLogin.success).toBe(true);
    expect(unbannedLogin.data?.token).toBeTruthy();
  });

  it("handles soft delete (Trash 30 Days): blocks login with official deleted notice, allows restoration and permanent purge", async () => {
    const trashEmail = `trash-${Date.now()}@testrestaurant.in`;
    const password = "TrashTestPassword123!";
    const signup = await signupUser({ email: trashEmail, password, fullName: "Trash Owner", clientIp: `trash-ip-${Date.now()}` });
    expect(signup.success).toBe(true);
    const otp = signup.data?.devOtp;
    expect(otp).toBeTruthy();
    await verifyUserOtp({ email: trashEmail, otp: otp!, type: "SIGNUP" });

    const user = await userStore.findByEmail(trashEmail);
    expect(user).toBeTruthy();

    // 1. Move to Trash (Soft Delete)
    const softDeleted = await userStore.softDelete(user!.id);
    expect(softDeleted).toBe(true);

    const trashedUser = await userStore.findById(user!.id);
    expect(trashedUser?.deletedAt).toBeTruthy();

    // 2. Attempt login -> Must fail with 403 and official notice
    const loginAttempt = await loginUser({ email: trashEmail, password, clientIp: `trash-login-ip-${Date.now()}` });
    expect(loginAttempt.success).toBe(false);
    expect(loginAttempt.status).toBe(403);
    expect(loginAttempt.error).toContain("Menuly Official: Your account has been deleted by administration.");

    // 3. Attempt forgot password -> Must fail with 403
    const forgotAttempt = await forgotPassword({ email: trashEmail, clientIp: `trash-forgot-ip-${Date.now()}` });
    expect(forgotAttempt.success).toBe(false);
    expect(forgotAttempt.status).toBe(403);
    expect(forgotAttempt.error).toContain("Menuly Official: Your account has been deleted by administration.");

    // 4. Restore user from Trash
    const restored = await userStore.restore(user!.id);
    expect(restored).toBe(true);

    const activeUser = await userStore.findById(user!.id);
    expect(activeUser?.deletedAt).toBeNull();

    // Login succeeds after restore
    const restoredLogin = await loginUser({ email: trashEmail, password, clientIp: `trash-restore-ip-${Date.now()}` });
    expect(restoredLogin.success).toBe(true);

    // 5. Permanent Purge
    const purged = await userStore.purge(user!.id);
    expect(purged).toBe(true);
    const purgedLookup = await userStore.findById(user!.id);
    expect(purgedLookup).toBeNull();
  });

  it("strictly validates registered user in database for forgot-password: rejects unregistered email and phone with 404", async () => {
    // 1. Unregistered email
    const unknownEmailRes = await forgotPassword({
      email: "never-registered-9999@randomdomain.xyz",
      clientIp: `test-unknown-email-${Date.now()}`,
    });
    expect(unknownEmailRes.success).toBe(false);
    expect(unknownEmailRes.status).toBe(404);
    expect(unknownEmailRes.error).toContain("No registered account found");

    // 2. Unregistered phone number
    const unknownPhoneRes = await forgotPassword({
      identifier: "9000000001",
      clientIp: `test-unknown-phone-${Date.now()}`,
    });
    expect(unknownPhoneRes.success).toBe(false);
    expect(unknownPhoneRes.status).toBe(404);
    expect(unknownPhoneRes.error).toContain("No registered account found");
  });

  it("requires WhatsApp OTP verification to link/change phone from Profile and enforces uniqueness", async () => {
    // 1. User A registers with email only (skipped phone during signup)
    const emailA = `skip-phone-a-${Date.now()}@testrestaurant.in`;
    const signupA = await signupUser({
      email: emailA,
      password: "Password123!",
      fullName: "Chef Alice",
      clientIp: `ip-alice-${Date.now()}`,
    });
    expect(signupA.success).toBe(true);
    await verifyUserOtp({ email: emailA, otp: signupA.data!.devOtp!, type: "SIGNUP" });

    const userA = await userStore.findByEmail(emailA);
    expect(userA).toBeDefined();
    expect(userA?.phone).toBeNull();

    // 2. User A initiates phone linking from Profile
    const phoneA = "9876502222";
    const sendOtpRes = await sendPhoneVerificationOtp({
      email: emailA,
      phone: phoneA,
      clientIp: `ip-alice-phone-${Date.now()}`,
    });
    expect(sendOtpRes.success).toBe(true);
    expect(sendOtpRes.data?.devOtp).toBeDefined();

    // Verify phone is NOT saved on User A before OTP verification!
    const userAUnverified = await userStore.findByEmail(emailA);
    expect(userAUnverified?.phone).toBeNull();

    // 3. User A enters incorrect OTP -> fails
    const badVerify = await verifyPhoneVerificationOtp({
      email: emailA,
      phone: phoneA,
      otp: "000000",
    });
    expect(badVerify.success).toBe(false);

    // 4. User A enters correct OTP -> succeeds and links number
    const goodVerify = await verifyPhoneVerificationOtp({
      email: emailA,
      phone: phoneA,
      otp: sendOtpRes.data!.devOtp!,
    });
    expect(goodVerify.success).toBe(true);
    expect(goodVerify.data?.phone).toBe("+919876502222");

    const userAVerified = await userStore.findByEmail(emailA);
    expect(userAVerified?.phone).toBe("+919876502222");

    // 5. User B registers with email
    const emailB = `skip-phone-b-${Date.now()}@testrestaurant.in`;
    const signupB = await signupUser({
      email: emailB,
      password: "Password123!",
      fullName: "Chef Bob",
      clientIp: `ip-bob-${Date.now()}`,
    });
    expect(signupB.success).toBe(true);
    await verifyUserOtp({ email: emailB, otp: signupB.data!.devOtp!, type: "SIGNUP" });

    // 6. User B tries to link User A's phone -> REJECTED with 400
    const conflictRes = await sendPhoneVerificationOtp({
      email: emailB,
      phone: phoneA, // Same number!
      clientIp: `ip-bob-conflict-${Date.now()}`,
    });
    expect(conflictRes.success).toBe(false);
    expect(conflictRes.status).toBe(400);
    expect(conflictRes.error).toContain("already linked to another Menuly account");
  });

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

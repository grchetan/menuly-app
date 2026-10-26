import { describe, it, expect, beforeEach } from "vitest";
import { otpStore } from "../server/auth/store";
import { hashOtp } from "../server/auth/security";
import { verifyUserOtp, resendUserOtp } from "../server/auth/service";

describe("Menuly OTP Security & Policy Verification Suite", () => {
  const testEmail = "policy-check@menuly.app";

  beforeEach(() => {
    // Fresh context for each test
  });

  it("POLICY 1: OTP expires strictly after 10 minutes and rejects verification", async () => {
    const rawOtp = "482910";
    const otpHash = await hashOtp(rawOtp);

    // Save an OTP that expired 1 second ago (simulating 10+ minutes passing)
    const expiredDate = new Date(Date.now() - 1000);
    await otpStore.saveOtp({
      email: testEmail,
      otpHash,
      type: "SIGNUP",
      expiresAt: expiredDate,
    });

    const result = await verifyUserOtp({
      email: testEmail,
      otp: rawOtp,
      type: "SIGNUP",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/expired|not requested/i);
  });

  it("POLICY 2: Valid OTP within 10 minutes passes verification", async () => {
    const rawOtp = "739182";
    const otpHash = await hashOtp(rawOtp);

    // 10 minutes in future
    const validUntil = new Date(Date.now() + 10 * 60 * 1000);
    await otpStore.saveOtp({
      email: testEmail,
      otpHash,
      type: "PASSWORD_RESET",
      expiresAt: validUntil,
    });

    const result = await verifyUserOtp({
      email: testEmail,
      otp: rawOtp,
      type: "PASSWORD_RESET",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data?.verified).toBe(true);
  });

  it("POLICY 3: Single-Use Protection — an already verified OTP cannot be reused", async () => {
    const rawOtp = "625104";
    const otpHash = await hashOtp(rawOtp);
    const validUntil = new Date(Date.now() + 10 * 60 * 1000);

    await otpStore.saveOtp({
      email: testEmail,
      otpHash,
      type: "PASSWORD_RESET",
      expiresAt: validUntil,
    });

    // First attempt: should succeed
    const firstAttempt = await verifyUserOtp({
      email: testEmail,
      otp: rawOtp,
      type: "PASSWORD_RESET",
    });
    expect(firstAttempt.success).toBe(true);

    // Second attempt with the SAME OTP: must be strictly rejected
    const secondAttempt = await verifyUserOtp({
      email: testEmail,
      otp: rawOtp,
      type: "PASSWORD_RESET",
    });
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toMatch(/expired|not requested/i);
  });

  it("POLICY 4: Max 5 failed attempts locks the OTP", async () => {
    const correctOtp = "998877";
    const wrongOtp = "000000";
    const otpHash = await hashOtp(correctOtp);
    const validUntil = new Date(Date.now() + 10 * 60 * 1000);

    const emailForLock = "lockout-test@menuly.app";
    await otpStore.saveOtp({
      email: emailForLock,
      otpHash,
      type: "PASSWORD_RESET",
      expiresAt: validUntil,
      maxAttempts: 5,
    });

    // Make 5 wrong attempts
    for (let i = 1; i <= 5; i++) {
      const res = await verifyUserOtp({
        email: emailForLock,
        otp: wrongOtp,
        type: "PASSWORD_RESET",
      });
      expect(res.success).toBe(false);
    }

    // Now even with the CORRECT OTP, it must be locked!
    const correctAfterLock = await verifyUserOtp({
      email: emailForLock,
      otp: correctOtp,
      type: "PASSWORD_RESET",
    });

    expect(correctAfterLock.success).toBe(false);
    expect(correctAfterLock.error).toMatch(/Too many failed verification attempts|Maximum verification attempts exceeded|locked/i);
  });

  it("POLICY 5: 60-Second Cooldown prevents OTP Resend spamming", async () => {
    const cooldownEmail = "cooldown-check@menuly.app";

    // 1st resend: allowed
    const r1 = await resendUserOtp({ email: cooldownEmail, type: "SIGNUP" });
    expect(r1.success).toBe(true);

    // Immediate 2nd resend: blocked by 60-second cooldown
    const r2 = await resendUserOtp({ email: cooldownEmail, type: "SIGNUP" });
    expect(r2.success).toBe(false);
    expect(r2.status).toBe(429);
    expect(r2.error).toMatch(/wait \d+ seconds/i);
  });
});

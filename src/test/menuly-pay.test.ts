import { describe, it, expect } from "vitest";
import {
  calculatePhonePeChecksum,
  verifyPhonePeWebhookSignature,
  parseKotak811CreditAlert,
  calculateDynamicPaiseOffset,
  buildKotakDirectUpiUri,
  PHONEPE_SANDBOX_MID,
  PHONEPE_SANDBOX_SALT_KEY,
} from "../server/payments/menuly-pay";

describe("MenulyPay In-House Native UPI Payment Gateway Suite", () => {
  it("calculates correct PhonePe SHA256 checksum for initiate payment", () => {
    const payload = {
      merchantId: PHONEPE_SANDBOX_MID,
      merchantTransactionId: "MNL-TXN-12345",
      amount: 32900,
    };
    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = calculatePhonePeChecksum(
      base64,
      "/pg/v1/pay",
      PHONEPE_SANDBOX_SALT_KEY,
      1
    );

    expect(checksum).toContain("###1");
    expect(checksum.length).toBe(64 + 4); // 64-char sha256 hex + ###1
  });

  it("calculates correct PhonePe SHA256 checksum for status query", () => {
    const checksum = calculatePhonePeChecksum(
      "",
      `/pg/v1/status/${PHONEPE_SANDBOX_MID}/MNL-TXN-12345`,
      PHONEPE_SANDBOX_SALT_KEY,
      1
    );

    expect(checksum).toContain("###1");
    expect(checksum.length).toBe(68);
  });

  it("verifies PhonePe webhook signature and rejects spoofed callbacks", () => {
    const responsePayload = {
      success: true,
      code: "PAYMENT_SUCCESS",
      message: "Your payment is successful",
      data: {
        merchantTransactionId: "MNL-TXN-12345",
        amount: 32900,
      },
    };
    const base64Response = Buffer.from(JSON.stringify(responsePayload)).toString("base64");
    const validSignature = calculatePhonePeChecksum(
      base64Response,
      "",
      PHONEPE_SANDBOX_SALT_KEY,
      1
    );

    // 1. Should accept valid signature
    const isValid = verifyPhonePeWebhookSignature(
      base64Response,
      validSignature,
      PHONEPE_SANDBOX_SALT_KEY,
      1
    );
    expect(isValid).toBe(true);

    // 2. Should reject altered/spoofed signature
    const isFake = verifyPhonePeWebhookSignature(
      base64Response,
      "fake_hash_123###1",
      PHONEPE_SANDBOX_SALT_KEY,
      1
    );
    expect(isFake).toBe(false);
  });

  it("parses Chetan's actual Kotak 811 credit alert email accurately", () => {
    const emailText = `
Hi 811 Customer,

You've received a UPI Credit in your Kotak A/c (XX9348).

Here's the summary of your transaction:
Date: 12-Nov-26
Amount: ₹409.00
Sender: CHETAN
UPI Reference Number (RRN): 006914192328

View balance: https://kotak811.com/mbapp/pay
`;

    const parsed = parseKotak811CreditAlert(emailText);
    expect(parsed.amount).toBe(409);
    expect(parsed.sender).toBe("CHETAN");
    expect(parsed.rrn).toBe("006914192328");
    expect(parsed.date).toBe("12-Nov-26");
  });

  it("calculates dynamic paise offsets to guarantee 0 collisions on identical amounts", () => {
    const baseAmount = 409;

    // First user gets exact base amount
    const firstUser = calculateDynamicPaiseOffset(baseAmount, []);
    expect(firstUser).toBe(409.0);

    // Second user ordering at the same minute gets 5 paise offset
    const secondUser = calculateDynamicPaiseOffset(baseAmount, [409.0]);
    expect(secondUser).toBe(409.05);

    // Third user gets 10 paise offset
    const thirdUser = calculateDynamicPaiseOffset(baseAmount, [409.0, 409.05]);
    expect(thirdUser).toBe(409.1);
  });

  it("builds NPCI-compliant Kotak Direct UPI payment URI", () => {
    const uri = buildKotakDirectUpiUri({
      amount: 409,
      transactionId: "MNL-TXN-9988",
      orderNumber: "MNL-ORD-9988",
      upiId: "9179878521@kotakbank",
      accountName: "Menuly India",
    });

    expect(uri).toContain("pa=9179878521@kotakbank");
    expect(uri).toContain("am=409");
    expect(uri).toContain("pn=Menuly%20India");
    expect(uri).toContain("tr=MNL-TXN-9988");
    expect(uri).toContain("tn=Order_MNL-ORD-9988");
  });
});

/**
 * Menuly WhatsApp OTP Sender Client
 * Dispatches verification OTPs to diners and restaurant owners via the Menuly WhatsApp Gateway (Baileys/Koyeb).
 * Includes strict safety guards to prevent dispatching test OTPs to random numbers.
 */

export interface SendWhatsAppOtpResult {
  success: boolean;
  messageId?: string | undefined;
  phone?: string | undefined;
  error?: string | undefined;
}

/**
 * Whitelist of phone numbers authorized to receive real WhatsApp OTPs during testing.
 * Owner's dedicated testing WhatsApp number: 9179878521 (+91 9179878521).
 */
export const PRIMARY_TEST_WHATSAPP_PHONE = "9179878521";

/**
 * Checks whether a phone number is in the authorized test whitelist
 */
export function isAuthorizedTestPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);

  // Check hardcoded primary owner test number
  if (last10 === PRIMARY_TEST_WHATSAPP_PHONE) {
    return true;
  }

  // Check additional test numbers from environment variable (comma-separated)
  const envTestPhones = process.env["TEST_WHATSAPP_PHONE"];
  if (envTestPhones) {
    const list = envTestPhones.split(",").map((p) => p.replace(/\D/g, "").slice(-10));
    if (list.includes(last10)) {
      return true;
    }
  }

  return false;
}

export async function sendWhatsAppOtp(
  phone: string,
  otp: string,
  type: "SIGNUP" | "PASSWORD_RESET" | "LOGIN" = "SIGNUP"
): Promise<SendWhatsAppOtpResult> {
  if (!phone || typeof phone !== "string") {
    return { success: false, error: "Invalid phone number provided" };
  }

  const cleanDigits = phone.replace(/\D/g, "");
  const tenDigits = cleanDigits.slice(-10);
  const formattedPhone = `+91${tenDigits}`;

  // 1. AUTOMATED TEST SUITE SAFETY GUARD (Vitest / CI)
  // In automated test runs, never dispatch real WhatsApp messages to random generated numbers!
  const isAutomatedTest = Boolean(
    process.env["VITEST"] || process.env["NODE_ENV"] === "test"
  );
  if (isAutomatedTest && process.env["SEND_REAL_WHATSAPP_IN_TESTS"] !== "true") {
    return {
      success: true,
      messageId: `vitest-simulated-${Date.now()}`,
      phone: formattedPhone,
    };
  }

  // 2. DEVELOPMENT & TESTING SAFETY GUARD
  // If running in development OR if WHATSAPP_RESTRICT_TO_TEST is enabled,
  // ONLY the authorized test number (9179878521) will receive real WhatsApp messages.
  // Any other number is simulated in console so real people never receive accidental OTPs!
  const isDev = process.env["NODE_ENV"] !== "production";
  const restrictToTest = process.env["WHATSAPP_RESTRICT_TO_TEST"] !== "false";
  const isAuthorized = isAuthorizedTestPhone(formattedPhone);

  if ((isDev || restrictToTest) && !isAuthorized) {
    console.log("================================================================");
    console.log("📱 [MENULY WHATSAPP OTP — SAFETY GUARD ACTIVE]");
    console.log(`Recipient:   ${formattedPhone} (SIMULATED — Not in test whitelist)`);
    console.log(`Type:        ${type}`);
    console.log(`🔑 OTP:      >>> ${otp} <<<`);
    console.log(`ℹ️ Real WhatsApp dispatch is strictly restricted to authorized number: +91 ${PRIMARY_TEST_WHATSAPP_PHONE}`);
    console.log("================================================================");
    return {
      success: true,
      messageId: `dev-safety-guard-${Date.now()}`,
      phone: formattedPhone,
    };
  }

  // 3. REAL DISPATCH (Authorized Test Number or Production Live Users)
  console.log(`[WhatsApp Dispatch] Sending real OTP to: ${formattedPhone} (Type: ${type})`);

  const botUrl = (
    process.env["WHATSAPP_BOT_URL"] || "https://menuly-whatsapp-bot.onrender.com"
  ).replace(/\/$/, "");
  const apiKey = process.env["WHATSAPP_BOT_SECRET"] || "menuly-whatsapp-secret-2026";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${botUrl}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ phone: formattedPhone, otp, type }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || !data["success"]) {
      return {
        success: false,
        error: String(data["error"] || `WhatsApp Gateway returned HTTP ${res.status}`),
      };
    }

    return {
      success: true,
      ...(typeof data["messageId"] === "string" ? { messageId: data["messageId"] } : {}),
      phone: formattedPhone,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[WhatsApp Dispatch Warning] Failed to reach bot at ${botUrl}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Menuly WhatsApp OTP Sender Client
 * Dispatches verification OTPs to diners and restaurant owners via the Menuly WhatsApp Gateway (Baileys/Koyeb).
 */

export interface SendWhatsAppOtpResult {
  success: boolean;
  messageId?: string | undefined;
  phone?: string | undefined;
  error?: string | undefined;
}

export async function sendWhatsAppOtp(
  phone: string,
  otp: string,
  type: "SIGNUP" | "PASSWORD_RESET" | "LOGIN" = "SIGNUP"
): Promise<SendWhatsAppOtpResult> {
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
      body: JSON.stringify({ phone, otp, type }),
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
      ...(typeof data["phone"] === "string" ? { phone: data["phone"] } : {}),
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

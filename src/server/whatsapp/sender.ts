/**
 * Menuly WhatsApp OTP Sender Client
 * Dispatches verification OTPs to diners and restaurant owners via the Menuly WhatsApp Gateway (Baileys/Koyeb).
 */

export interface SendWhatsAppOtpResult {
  success: boolean;
  messageId?: string;
  phone?: string;
  error?: string;
}

export async function sendWhatsAppOtp(
  phone: string,
  otp: string,
  type: "SIGNUP" | "PASSWORD_RESET" | "LOGIN" = "SIGNUP"
): Promise<SendWhatsAppOtpResult> {
  const botUrl = (process.env["WHATSAPP_BOT_URL"] || "http://localhost:3000").replace(/\/$/, "");
  const apiKey = process.env["WHATSAPP_BOT_SECRET"] || "menuly-whatsapp-secret-2026";

  try {
    const res = await fetch(`${botUrl}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ phone, otp, type }),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || !data["success"]) {
      return {
        success: false,
        error: String(data["error"] || `WhatsApp Gateway returned HTTP ${res.status}`),
      };
    }

    return {
      success: true,
      messageId: typeof data["messageId"] === "string" ? data["messageId"] : undefined,
      phone: typeof data["phone"] === "string" ? data["phone"] : undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[WhatsApp Dispatch Warning] Failed to reach bot at ${botUrl}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

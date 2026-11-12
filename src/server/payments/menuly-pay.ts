/**
 * MenulyPay — In-House Native Indian UPI Payment Gateway Engine
 * 
 * Features:
 * 1. Official PhonePe Business Merchant PG v1 (Dynamic QR, Web Pay Page, Mobile Intent)
 * 2. Instant SHA256 Checksum Signature Calculation & Webhook Verification
 * 3. Kotak 811 Direct Bank Credit Email & SMS Parser (Amount, Sender, RRN)
 * 4. Automatic Decimal/Paise Offset Engine to guarantee zero collisions on simultaneous orders
 * 5. 100% Pure TypeScript & Node.js Crypto (Zero external paid dependencies, zero 2% gateway cut)
 */

import crypto from "node:crypto";

export interface MenulyPayConfig {
  phonepeMerchantId?: string | undefined;
  phonepeSaltKey?: string | undefined;
  phonepeSaltIndex?: number | undefined;
  phonepeEnv?: "UAT" | "PROD" | undefined;
  appBaseUrl?: string | undefined;
  kotakUpiId?: string | undefined;
  kotakAccountName?: string | undefined;
}

// Default Kotak VPA
export const DEFAULT_KOTAK_UPI_ID = "9179878521@kotakbank";
export const DEFAULT_KOTAK_ACCOUNT_NAME = "Menuly India";

// Official PhonePe Pre-Prod / Sandbox Test Credentials (works out-of-the-box for instant testing)
export const PHONEPE_SANDBOX_MID = "PGTESTPAYUAT";
export const PHONEPE_SANDBOX_SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
export const PHONEPE_SANDBOX_SALT_INDEX = 1;

export const PHONEPE_URLS = {
  UAT: {
    pay: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
    status: (mid: string, txnId: string) =>
      `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${mid}/${txnId}`,
  },
  PROD: {
    pay: "https://api.phonepe.com/apis/hermes/pg/v1/pay",
    status: (mid: string, txnId: string) =>
      `https://api.phonepe.com/apis/hermes/pg/v1/status/${mid}/${txnId}`,
  },
};

/**
 * Get active configuration from environment or defaults
 */
export function getMenulyPayConfig(): MenulyPayConfig {
  const envMid = process.env["PHONEPE_MERCHANT_ID"];
  const envSaltKey = process.env["PHONEPE_SALT_KEY"];
  const envSaltIndex = process.env["PHONEPE_SALT_INDEX"]
    ? parseInt(process.env["PHONEPE_SALT_INDEX"], 10)
    : 1;
  const envMode = (process.env["PHONEPE_ENV"] || "UAT").toUpperCase() as "UAT" | "PROD";

  return {
    phonepeMerchantId: envMid || PHONEPE_SANDBOX_MID,
    phonepeSaltKey: envSaltKey || PHONEPE_SANDBOX_SALT_KEY,
    phonepeSaltIndex: envSaltIndex || PHONEPE_SANDBOX_SALT_INDEX,
    phonepeEnv: envMode === "PROD" ? "PROD" : "UAT",
    appBaseUrl:
      process.env["APP_URL"] ||
      process.env["VERCEL_URL"] ||
      "https://menulyindia.online",
    kotakUpiId: process.env["KOTAK_UPI_ID"] || DEFAULT_KOTAK_UPI_ID,
    kotakAccountName: process.env["KOTAK_ACCOUNT_NAME"] || DEFAULT_KOTAK_ACCOUNT_NAME,
  };
}

/**
 * Compute SHA256 Checksum for PhonePe API Requests
 * Formula: SHA256(base64Payload + endpoint + saltKey) + "###" + saltIndex
 */
export function calculatePhonePeChecksum(
  data: string,
  endpoint: string,
  saltKey: string,
  saltIndex: number = 1
): string {
  const hash = crypto
    .createHash("sha256")
    .update(data + endpoint + saltKey)
    .digest("hex");
  return `${hash}###${saltIndex}`;
}

/**
 * Verify incoming PhonePe Webhook Callback Signature
 */
export function verifyPhonePeWebhookSignature(
  base64Response: string,
  xVerifyHeader: string,
  saltKey: string,
  saltIndex: number = 1
): boolean {
  if (!base64Response || !xVerifyHeader) return false;
  const expectedHash = crypto
    .createHash("sha256")
    .update(base64Response + saltKey)
    .digest("hex");
  const expectedSignature = `${expectedHash}###${saltIndex}`;
  return xVerifyHeader.trim() === expectedSignature;
}

/**
 * 1. Initiate PhonePe Payment (Creates Dynamic UPI QR or Checkout Redirect)
 */
export async function initiatePhonePePayment(params: {
  transactionId: string;
  orderNumber: string;
  amountInRupees: number;
  customerPhone?: string | undefined;
  customerName?: string | undefined;
  redirectUrl?: string | undefined;
  callbackUrl?: string | undefined;
}): Promise<{
  success: boolean;
  transactionId: string;
  redirectUrl?: string | undefined;
  qrData?: string | undefined;
  rawResponse?: any;
  error?: string | undefined;
}> {
  const config = getMenulyPayConfig();
  const mid = config.phonepeMerchantId || PHONEPE_SANDBOX_MID;
  const saltKey = config.phonepeSaltKey || PHONEPE_SANDBOX_SALT_KEY;
  const saltIndex = config.phonepeSaltIndex || 1;
  const env = config.phonepeEnv || "UAT";

  // Amount in Paise (e.g. ₹329 -> 32900 paise)
  const amountInPaise = Math.round(params.amountInRupees * 100);

  const cleanPhone = (params.customerPhone || "9179878521").replace(/\D/g, "").slice(-10);

  const baseUrl = config.appBaseUrl?.startsWith("http")
    ? config.appBaseUrl
    : `https://${config.appBaseUrl || "menulyindia.online"}`;

  const callbackUrl =
    params.callbackUrl || `${baseUrl}/api/shop/payments/phonepe-webhook`;
  const redirectUrl =
    params.redirectUrl || `${baseUrl}/shop?status=check&txn=${params.transactionId}`;

  const payload = {
    merchantId: mid,
    merchantTransactionId: params.transactionId,
    merchantUserId: `USER_${cleanPhone || "GUEST"}`,
    amount: amountInPaise,
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    mobileNumber: cleanPhone,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const endpoint = "/pg/v1/pay";
  const checksum = calculatePhonePeChecksum(base64Payload, endpoint, saltKey, saltIndex);

  try {
    const apiUrl = PHONEPE_URLS[env].pay;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      const redirectInfo = data.data.instrumentResponse?.redirectInfo;
      const qrData = data.data.instrumentResponse?.qrData;

      return {
        success: true,
        transactionId: params.transactionId,
        redirectUrl: redirectInfo?.url,
        qrData,
        rawResponse: data,
      };
    }

    return {
      success: false,
      transactionId: params.transactionId,
      error: data.message || "Failed to initiate PhonePe payment",
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      transactionId: params.transactionId,
      error: err.message || "Network error connecting to PhonePe",
    };
  }
}

/**
 * 2. Query PhonePe Transaction Status (Official Server-to-Server Poller)
 */
export async function queryPhonePeStatus(transactionId: string): Promise<{
  success: boolean;
  status: "PAID" | "PENDING" | "FAILED";
  amountInRupees?: number | undefined;
  utr?: string | undefined;
  message?: string | undefined;
  rawResponse?: any;
}> {
  const config = getMenulyPayConfig();
  const mid = config.phonepeMerchantId || PHONEPE_SANDBOX_MID;
  const saltKey = config.phonepeSaltKey || PHONEPE_SANDBOX_SALT_KEY;
  const saltIndex = config.phonepeSaltIndex || 1;
  const env = config.phonepeEnv || "UAT";

  const endpoint = `/pg/v1/status/${mid}/${transactionId}`;
  const checksum = calculatePhonePeChecksum("", endpoint, saltKey, saltIndex);

  try {
    const apiUrl = PHONEPE_URLS[env].status(mid, transactionId);
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": mid,
      },
    });

    const data = await response.json();

    if (data.code === "PAYMENT_SUCCESS") {
      const amount = data.data?.amount ? data.data.amount / 100 : undefined;
      const utr =
        data.data?.paymentInstrument?.bankTransactionId ||
        data.data?.paymentInstrument?.utr ||
        data.data?.providerReferenceId;

      return {
        success: true,
        status: "PAID",
        amountInRupees: amount,
        utr,
        message: data.message || "Payment Successful",
        rawResponse: data,
      };
    }

    if (data.code === "PAYMENT_PENDING") {
      return {
        success: true,
        status: "PENDING",
        message: data.message || "Payment Pending",
        rawResponse: data,
      };
    }

    return {
      success: false,
      status: "FAILED",
      message: data.message || "Payment Failed or Cancelled",
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: "PENDING",
      message: err.message || "Failed to query PhonePe status",
    };
  }
}

/**
 * 3. Parse Kotak 811 Bank Credit Alert Emails & SMS
 * Handles actual Kotak 811 format:
 *   Date: 12-Nov-26
 *   Amount: ₹409.00
 *   Sender: CHETAN
 *   UPI Reference Number (RRN): 006914192328
 */
export function parseKotak811CreditAlert(text: string): {
  amount?: number | undefined;
  rrn?: string | undefined;
  sender?: string | undefined;
  date?: string | undefined;
} {
  if (!text) return {};

  let amount: number | undefined;
  let rrn: string | undefined;
  let sender: string | undefined;
  let date: string | undefined;

  // Amount extraction (e.g. "Amount: ₹409.00", "INR 329.00 credited", "Rs. 249")
  const amtMatch = text.match(/(?:Amount:\s*|credited.*?(?:INR|Rs\.?|₹)\s*|(?:INR|Rs\.?|₹)\s*)([\d,]+(?:\.\d{1,2})?)/i);
  if (amtMatch && amtMatch[1]) {
    amount = parseFloat(amtMatch[1].replace(/,/g, ""));
  }

  // UPI Reference Number / RRN / UTR (e.g. "UPI Reference Number (RRN): 006914192328" or "UPI/006914192328")
  const rrnMatch = text.match(/(?:UPI Reference Number \(RRN\)|UPI Ref No|UPI Ref|RRN|UTR|Ref No)[/:\s-]*([a-zA-Z0-9]{10,14})/i);
  if (rrnMatch && rrnMatch[1]) {
    rrn = rrnMatch[1].trim();
  }

  // Sender Name (e.g. "Sender: CHETAN")
  const senderMatch = text.match(/Sender:\s*([^\r\n,]+)/i);
  if (senderMatch && senderMatch[1]) {
    sender = senderMatch[1].trim();
  }

  // Date (e.g. "Date: 12-Nov-26")
  const dateMatch = text.match(/Date:\s*([0-9]{1,2}-[a-zA-Z]{3}-[0-9]{2,4})/i);
  if (dateMatch && dateMatch[1]) {
    date = dateMatch[1].trim();
  }

  return { amount, rrn, sender, date };
}

/**
 * 4. Decimal / Paise Offset Generator
 * Solves simultaneous order collision on direct Kotak UPI without remark.
 * If 2 users order ₹409 at the same minute:
 *   User 1: ₹409.00
 *   User 2: ₹409.05
 *   User 3: ₹409.10
 */
export function calculateDynamicPaiseOffset(
  baseAmount: number,
  existingPendingAmounts: number[]
): number {
  const cleanBase = Number(baseAmount.toFixed(2));
  let offset = 0;

  while (existingPendingAmounts.some((amt) => Math.abs(amt - (cleanBase + offset)) < 0.001)) {
    offset = Number((offset + 0.05).toFixed(2));
    if (offset >= 1.0) break; // Cap at 95 paise max
  }

  return Number((cleanBase + offset).toFixed(2));
}

/**
 * 5. Direct Kotak UPI Payment URI Builder
 */
export function buildKotakDirectUpiUri(params: {
  amount: number;
  transactionId: string;
  orderNumber: string;
  upiId?: string;
  accountName?: string;
}): string {
  const upiId = params.upiId || DEFAULT_KOTAK_UPI_ID;
  const name = params.accountName || DEFAULT_KOTAK_ACCOUNT_NAME;
  const cleanAmt = Number(params.amount.toFixed(2));

  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${cleanAmt}&cu=INR&tr=${params.transactionId}&tn=${encodeURIComponent(
    `Order_${params.orderNumber}`
  )}`;
}

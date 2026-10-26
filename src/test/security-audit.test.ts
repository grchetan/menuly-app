import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizePrice,
  sanitizeUrl,
  sanitizeColor,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
} from "../server/security/sanitize";
import { checkRateLimit } from "../server/auth/rate-limiter";

describe("Menuly Comprehensive Security Audit & Hardening Tests", () => {
  describe("Input Sanitization & XSS Defense", () => {
    it("strips harmful <script> tags and embedded event handlers", () => {
      const maliciousName = "Paneer Butter Masala<script>alert('pwned')</script>";
      expect(sanitizeText(maliciousName)).toBe("Paneer Butter Masala");

      const maliciousAttr = "Dal Makhani<img src=x onerror=alert(1)>";
      expect(sanitizeText(maliciousAttr)).toBe("Dal Makhani");

      const jsProtocol = "javascript:alert(1)";
      expect(sanitizeText(jsProtocol)).toBe("alert(1)");
    });

    it("prevents XSS payloads in URLs and image sources", () => {
      expect(sanitizeUrl("javascript:alert(document.cookie)")).toBeNull();
      expect(sanitizeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBeNull();
      expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();

      // Legitimate HTTP/HTTPS and compressed data URLs must pass
      expect(sanitizeUrl("https://images.unsplash.com/photo-paneer")).toBe("https://images.unsplash.com/photo-paneer");
      expect(sanitizeUrl("http://cdn.menuly.app/badge.png")).toBe("http://cdn.menuly.app/badge.png");
      expect(sanitizeUrl("/icons/apple-touch-icon.png")).toBe("/icons/apple-touch-icon.png");
      expect(sanitizeUrl("data:image/webp;base64,UklGRmYAAABXRUJQVlA4...==")).toBe("data:image/webp;base64,UklGRmYAAABXRUJQVlA4...==");
    });

    it("enforces safe color codes and blocks CSS injection", () => {
      expect(sanitizeColor("#0f5132")).toBe("#0f5132");
      expect(sanitizeColor("#fff")).toBe("#fff");
      expect(sanitizeColor("rgb(15, 81, 50)")).toBe("rgb(15, 81, 50)");
      expect(sanitizeColor("rgba(15, 81, 50, 0.9)")).toBe("rgba(15, 81, 50, 0.9)");

      // Malicious payloads must fall back to default brand color
      expect(sanitizeColor("red; background-image: url('http://evil.com')")).toBe("#0f5132");
      expect(sanitizeColor("<script>")).toBe("#0f5132");
    });
  });

  describe("Financial Integrity & Price Manipulation (IDOR / Negative Numbers)", () => {
    it("strictly prevents negative dish prices and NaN", () => {
      expect(sanitizePrice(-500)).toBe(0);
      expect(sanitizePrice("-120")).toBe(0);
      expect(sanitizePrice("free")).toBe(0);
      expect(sanitizePrice(NaN)).toBe(0);
      expect(sanitizePrice(Infinity)).toBe(0);
      expect(sanitizePrice(null)).toBe(0);
    });

    it("caps unrealistically massive prices and rounds to 2 decimals", () => {
      expect(sanitizePrice(999_999_999)).toBe(100_000);
      expect(sanitizePrice(249.999)).toBe(250);
      expect(sanitizePrice(180.5)).toBe(180.5);
    });
  });

  describe("Prototype Pollution Immunity", () => {
    it("strips __proto__, constructor, and prototype from parsed objects", () => {
      const maliciousPayload = JSON.parse(`{
        "name": "Crispy Dosa",
        "price": 140,
        "__proto__": { "isAdmin": true },
        "constructor": { "prototype": { "polluted": true } }
      }`);

      const cleaned = sanitizeObject(maliciousPayload) as Record<string, any>;
      expect(cleaned["name"]).toBe("Crispy Dosa");
      expect(cleaned["price"]).toBe(140);
      expect(Object.prototype.hasOwnProperty.call(cleaned, "__proto__")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(cleaned, "constructor")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(cleaned, "prototype")).toBe(false);
      expect((({} as any).polluted)).toBeUndefined();
      expect((({} as any).isAdmin)).toBeUndefined();
    });
  });

  describe("Rate Limiting Protection", () => {
    it("throttles excessive requests within defined window", () => {
      const testKey = `test_rate_${Date.now()}`;
      const limit = { windowMs: 1000, max: 3 };

      const r1 = checkRateLimit(testKey, limit);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(testKey, limit);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(testKey, limit);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(testKey, limit);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });
  });
});

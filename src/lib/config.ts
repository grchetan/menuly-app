// App-wide branding and support contacts. Replace the placeholders with real details.
export const APP_NAME = "Menuly";
export const SUPPORT_WHATSAPP = "919999999999"; // digits only, with country code
export const SUPPORT_EMAIL = "menulyofficial@gmail.com";
export const CURRENCY = "₹";

export const formatPrice = (n: number | string) =>
  `${CURRENCY}${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const whatsappLink = (digits: string, text?: string) =>
  `https://wa.me/${digits.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

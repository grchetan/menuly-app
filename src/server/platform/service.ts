import { prisma } from "../db";

export interface PlatformSettingsData {
  maintenanceMode: boolean;
  strictVegOnly: boolean;
  supportWhatsApp: string;
  supportEmail: string;
  currency: string;
  announcementTicker: string;
  announcementTickerEnabled: boolean;
  allowNewSignups: boolean;
  demoMenuUrl: string;
  defaultStarterPreset: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsData = {
  maintenanceMode: false,
  strictVegOnly: true,
  supportWhatsApp: "919876543210",
  supportEmail: "menulyofficial@gmail.com",
  currency: "₹ (INR)",
  announcementTicker:
    "Scan the QR 💥 See the menu 💥 Update prices anytime 💥 Mark sold out in 1 tap 💥 Fast & Responsive 💥 Zero reprinting",
  announcementTickerEnabled: true,
  allowNewSignups: true,
  demoMenuUrl: "https://menuly-app-blush.vercel.app/menu/menuly-official",
  defaultStarterPreset: "dhaba",
};

let cachedSettings: PlatformSettingsData | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 4000; // 4 seconds in-memory cache

export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  const now = Date.now();
  if (cachedSettings && now - lastCacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const rows = await prisma.platformSetting.findMany();
    const map = new Map<string, unknown>();
    for (const r of rows) {
      map.set(r.key, r.value);
    }

    const settings: PlatformSettingsData = {
      maintenanceMode: map.has("maintenance_mode")
        ? Boolean(map.get("maintenance_mode"))
        : map.has("maintenanceMode")
        ? Boolean(map.get("maintenanceMode"))
        : DEFAULT_PLATFORM_SETTINGS.maintenanceMode,
      strictVegOnly: map.has("pure_veg_strict_mode")
        ? Boolean(map.get("pure_veg_strict_mode"))
        : map.has("strictVegOnly")
        ? Boolean(map.get("strictVegOnly"))
        : DEFAULT_PLATFORM_SETTINGS.strictVegOnly,
      supportWhatsApp: map.has("support_whatsapp")
        ? String(map.get("support_whatsapp"))
        : map.has("supportWhatsApp")
        ? String(map.get("supportWhatsApp"))
        : DEFAULT_PLATFORM_SETTINGS.supportWhatsApp,
      supportEmail: map.has("support_email")
        ? String(map.get("support_email"))
        : map.has("supportEmail")
        ? String(map.get("supportEmail"))
        : DEFAULT_PLATFORM_SETTINGS.supportEmail,
      currency: map.has("currency")
        ? String(map.get("currency"))
        : DEFAULT_PLATFORM_SETTINGS.currency,
      announcementTicker: map.has("announcement_ticker")
        ? String(map.get("announcement_ticker"))
        : map.has("announcementTicker")
        ? String(map.get("announcementTicker"))
        : DEFAULT_PLATFORM_SETTINGS.announcementTicker,
      announcementTickerEnabled: map.has("announcement_ticker_enabled")
        ? Boolean(map.get("announcement_ticker_enabled"))
        : map.has("announcementTickerEnabled")
        ? Boolean(map.get("announcementTickerEnabled"))
        : DEFAULT_PLATFORM_SETTINGS.announcementTickerEnabled,
      allowNewSignups: map.has("allow_new_signups")
        ? Boolean(map.get("allow_new_signups"))
        : map.has("allowNewSignups")
        ? Boolean(map.get("allowNewSignups"))
        : DEFAULT_PLATFORM_SETTINGS.allowNewSignups,
      demoMenuUrl: map.has("demo_menu_url")
        ? String(map.get("demo_menu_url"))
        : map.has("demoMenuUrl")
        ? String(map.get("demoMenuUrl"))
        : DEFAULT_PLATFORM_SETTINGS.demoMenuUrl,
      defaultStarterPreset: map.has("default_starter_preset")
        ? String(map.get("default_starter_preset"))
        : map.has("defaultStarterPreset")
        ? String(map.get("defaultStarterPreset"))
        : DEFAULT_PLATFORM_SETTINGS.defaultStarterPreset,
    };

    cachedSettings = settings;
    lastCacheTimestamp = now;
    return settings;
  } catch (err) {
    console.error("[getPlatformSettings Error]", err);
    return cachedSettings || DEFAULT_PLATFORM_SETTINGS;
  }
}

export async function updatePlatformSettings(
  partial: Partial<PlatformSettingsData>
): Promise<PlatformSettingsData> {
  const current = await getPlatformSettings();
  const next: PlatformSettingsData = {
    ...current,
    ...partial,
  };

  const keyMap: [keyof PlatformSettingsData, string][] = [
    ["maintenanceMode", "maintenance_mode"],
    ["strictVegOnly", "pure_veg_strict_mode"],
    ["supportWhatsApp", "support_whatsapp"],
    ["supportEmail", "support_email"],
    ["currency", "currency"],
    ["announcementTicker", "announcement_ticker"],
    ["announcementTickerEnabled", "announcement_ticker_enabled"],
    ["allowNewSignups", "allow_new_signups"],
    ["demoMenuUrl", "demo_menu_url"],
    ["defaultStarterPreset", "default_starter_preset"],
  ];

  for (const [prop, dbKey] of keyMap) {
    if (partial[prop] !== undefined) {
      const val = next[prop];
      await prisma.platformSetting.upsert({
        where: { key: dbKey },
        create: {
          key: dbKey,
          value: val as any,
        },
        update: {
          value: val as any,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Invalidate cache immediately
  cachedSettings = next;
  lastCacheTimestamp = Date.now();
  return next;
}

export async function isMaintenanceModeActive(): Promise<boolean> {
  const settings = await getPlatformSettings();
  return Boolean(settings.maintenanceMode);
}

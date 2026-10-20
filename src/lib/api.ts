import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "./restaurant";

function isDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  return isDemoMode() && !localStorage.getItem("menuly_token");
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  label?: string | null;
  scans_count: number;
  created_at: string;
}

export interface PlatformPlan {
  id: string;
  name: string;
  slug: string;
  price_inr: number;
  max_dishes: number;
  max_tables: number;
  custom_branding: boolean;
  analytics_enabled: boolean;
  photo_uploads: boolean;
  features: string[];
}

export interface SupportTicketItem {
  id: string;
  restaurant_id?: string | null;
  restaurant_name: string;
  owner_email: string;
  owner_phone?: string | null;
  category: "QR Code" | "Menu Edit" | "Printing" | "Account" | "Other";
  subject: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PLANS: PlatformPlan[] = [
  {
    id: "plan-1",
    name: "Free Starter",
    slug: "starter",
    price_inr: 0,
    max_dishes: 15,
    max_tables: 1,
    custom_branding: false,
    analytics_enabled: true,
    photo_uploads: true,
    features: [
      "Up to 15 Dishes",
      "1 Master QR Code",
      "WebP Image Auto-Compression",
      "Standard Mobile Theme",
      "Instant Sold-Out Toggle",
    ],
  },
  {
    id: "plan-2",
    name: "Pro Growth",
    slug: "pro",
    price_inr: 499,
    max_dishes: 100,
    max_tables: 15,
    custom_branding: true,
    analytics_enabled: true,
    photo_uploads: true,
    features: [
      "Up to 100 Dishes",
      "15 Table-Specific QRs",
      "Custom Logo in QR Center",
      "Priority WhatsApp Orders",
      "Weekly Scan Trends",
      "High-Res Print Templates",
    ],
  },
  {
    id: "plan-3",
    name: "Multi-Table Enterprise",
    slug: "enterprise",
    price_inr: 1299,
    max_dishes: 500,
    max_tables: 50,
    custom_branding: true,
    analytics_enabled: true,
    photo_uploads: true,
    features: [
      "Unlimited Dishes",
      "50 Table QRs + Table Ordering",
      "Custom Domain Support",
      "Multi-Staff Kitchen Manager",
      "VIP Dedicated WhatsApp Support",
      "Complete CSV Export",
    ],
  },
];

/**
 * Record a QR Scan event (Public diner visit - no login required).
 */
export async function recordQRScan(data: {
  restaurantId: string;
  slug?: string | undefined;
  tableNumber?: string | null | undefined;
}): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // 1. Update local storage analytics for instant preview
    const key = `menuly_scans_${data.restaurantId || data.slug || "demo"}`;
    const curScans = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(curScans));

    // If table number present, update table counter
    if (data.tableNumber) {
      const tableKey = `menuly_table_scans_${data.restaurantId}_${data.tableNumber}`;
      const curTableScans = Number(localStorage.getItem(tableKey) || "0") + 1;
      localStorage.setItem(tableKey, String(curTableScans));
    }

    // 2. If Supabase is connected, log to backend table
    if (!isDemoSession()) {
      await supabase.from("qr_scans").insert({
        restaurant_id: data.restaurantId,
        table_number: data.tableNumber || null,
        user_agent: navigator.userAgent.slice(0, 150),
      });
    }
  } catch {
    // Fail silently so customer menu rendering is never interrupted
  }
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("menuly_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch Restaurant Tables (Owner Dashboard & QR Studio)
 */
export async function getRestaurantTables(restaurantId: string): Promise<RestaurantTable[]> {
  if (typeof window === "undefined") return [];

  const token = localStorage.getItem("menuly_token");
  if (token) {
    try {
      const res = await fetch("/api/restaurant/tables", { headers: getAuthHeader() });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.tables)) {
        return data.tables;
      }
    } catch {
      // fallback
    }
  }

  try {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number");
    if (error) throw error;
    return (data as RestaurantTable[]) || [];
  } catch {
    return [];
  }
}

/**
 * Save / Add Table for a Restaurant
 */
export async function saveRestaurantTable(
  restaurantId: string,
  tableNumber: string,
  label?: string
): Promise<RestaurantTable> {
  const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
  if (token) {
    const res = await fetch("/api/restaurant/tables/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ tableNumber, label }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.table) {
      return data.table;
    }
    throw new Error(data.error || "Failed to save table");
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .upsert({
      restaurant_id: restaurantId,
      table_number: tableNumber.trim(),
      label: label?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as RestaurantTable;
}

/**
 * Delete a Table
 */
export async function deleteRestaurantTable(restaurantId: string, tableId: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
  if (token) {
    const res = await fetch("/api/restaurant/tables/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ id: tableId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete table");
    }
    return;
  }

  await supabase.from("restaurant_tables").delete().eq("id", tableId);
}

/**
 * Bulk Generate Tables (e.g. Tables 1 through 10 in 1 click)
 */
export async function bulkGenerateTables(
  restaurantId: string,
  start: number = 1,
  count: number = 10
): Promise<RestaurantTable[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
  if (token) {
    const res = await fetch("/api/restaurant/tables/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ count, prefix: "Table " }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.tables)) {
      return data.tables;
    }
  }

  return await getRestaurantTables(restaurantId);
}

/**
 * Get Platform Plans
 */
export function getPlatformPlans(): PlatformPlan[] {
  return DEFAULT_PLANS;
}

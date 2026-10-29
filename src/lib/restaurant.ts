import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { slugify } from "./config";
import { compressImage } from "./image-compress";

export type Restaurant = Tables<"restaurants"> & {
  description?: string | null;
  isPureVeg?: boolean;
  galleryPhotos?: string[];
  profileVisits?: number;
  isFeatured?: boolean;
};
export type Category = Tables<"categories">;
export type MenuItem = Tables<"menu_items">;

export type WeeklyScanPoint = {
  day: string;
  date: string;
  scans: number;
  height: string;
};

export type RestaurantAnalytics = {
  totalScans: number;
  scansToday: number;
  tableScans: number;
  directVisits: number;
  scansThisWeek: number;
  weeklyScans: WeeklyScanPoint[];
};

export type FullMenu = {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  analytics?: RestaurantAnalytics;
};

export function isDemoMode(): boolean {
  return false;
}

export function setDemoMode(_active: boolean) {
  if (typeof window === "undefined") return;
  localStorage.removeItem("menuly_demo_mode");
}

export const INITIAL_DEMO_MENU: FullMenu = {
  restaurant: {
    id: "demo-rest-01",
    owner_id: "demo-user-01",
    name: "Royal Spice Restaurant",
    slug: "royal-spice-veg",
    address: "14, MG Road, Indiranagar, Bengaluru",
    phone: "+91 98765 43210",
    whatsapp: "919876543210",
    hours: "Mon–Sun, 10:00 AM – 11:00 PM",
    logo_url: null,
    cover_url: null,
    qr_fg: "#2e7d52",
    qr_bg: "#ffffff",
    qr_corner: "rounded",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  categories: [
    { id: "cat-1", restaurant_id: "demo-rest-01", name: "Tandoori & Starters", position: 0, created_at: new Date().toISOString() },
    { id: "cat-2", restaurant_id: "demo-rest-01", name: "Main Course Delicacies", position: 1, created_at: new Date().toISOString() },
    { id: "cat-3", restaurant_id: "demo-rest-01", name: "Clay Oven Breads & Rice", position: 2, created_at: new Date().toISOString() },
    { id: "cat-4", restaurant_id: "demo-rest-01", name: "Desserts & Beverages", position: 3, created_at: new Date().toISOString() },
  ],
  items: [
    {
      id: "item-1",
      restaurant_id: "demo-rest-01",
      category_id: "cat-1",
      name: "Paneer Tikka Angara",
      description: "Charcoal roasted cottage cheese marinated in crushed whole spices and hung curd.",
      price: 280,
      image_url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
      is_veg: true,
      available: true,
      position: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-2",
      restaurant_id: "demo-rest-01",
      category_id: "cat-1",
      name: "Dahi Ke Kebab",
      description: "Melt-in-mouth spiced yogurt patties with crushed cardamom and coriander.",
      price: 240,
      image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      is_veg: true,
      available: true,
      position: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-3",
      restaurant_id: "demo-rest-01",
      category_id: "cat-2",
      name: "Dal Makhani Amritsari",
      description: "Slow simmered black lentils cooked overnight with cream and desi butter.",
      price: 320,
      image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      is_veg: true,
      available: true,
      position: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-4",
      restaurant_id: "demo-rest-01",
      category_id: "cat-2",
      name: "Paneer Butter Masala",
      description: "Fresh cottage cheese cubes in rich tomato, cashew nut and butter gravy.",
      price: 340,
      image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
      is_veg: true,
      available: true,
      position: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-5",
      restaurant_id: "demo-rest-01",
      category_id: "cat-3",
      name: "Garlic Butter Naan",
      description: "Crisp tandoori bread glazed with minced garlic butter and fresh herbs.",
      price: 70,
      image_url: null,
      is_veg: true,
      available: true,
      position: 4,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-6",
      restaurant_id: "demo-rest-01",
      category_id: "cat-3",
      name: "Jeera Basmati Pulao",
      description: "Long grain basmati rice tempered with golden roasted cumin and ghee.",
      price: 160,
      image_url: null,
      is_veg: true,
      available: true,
      position: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-7",
      restaurant_id: "demo-rest-01",
      category_id: "cat-4",
      name: "Kesar Pista Matka Kulfi",
      description: "Slow reduced rabri kulfi flavored with Kashmiri saffron and Iranian pistachios.",
      price: 120,
      image_url: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80",
      is_veg: true,
      available: true,
      position: 6,
      created_at: new Date().toISOString(),
    },
    {
      id: "item-8",
      restaurant_id: "demo-rest-01",
      category_id: "cat-4",
      name: "Fresh Masala Chaas",
      description: "Freshly churned spiced buttermilk with roasted cumin, rock salt and mint.",
      price: 60,
      image_url: null,
      is_veg: true,
      available: true,
      position: 7,
      created_at: new Date().toISOString(),
    },
  ],
};

export function getLocalDemoMenu(): FullMenu {
  if (typeof window === "undefined") return INITIAL_DEMO_MENU;
  try {
    const raw = localStorage.getItem("menuly_demo_menu");
    if (raw) return JSON.parse(raw) as FullMenu;
  } catch {
    // fallback
  }
  return INITIAL_DEMO_MENU;
}

export function saveLocalDemoMenu(menu: FullMenu) {
  if (typeof window === "undefined") return;
  localStorage.setItem("menuly_demo_menu", JSON.stringify(menu));
}

export { type PresetTemplate, STARTER_PRESETS } from "./presets";

export async function applyPresetHelper(presetId: string): Promise<FullMenu> {
  const res = await fetch("/api/restaurant/preset", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ presetId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to load starter preset");
  }
  return data;
}

export function applyStarterPreset(presetId: string): FullMenu {
  const current = getLocalDemoMenu();
  return current;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("menuly_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Loads the signed-in owner's restaurant, creating one on first visit (or returns demo data if in demo mode). */
export async function loadMyMenu(): Promise<FullMenu> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    return getLocalDemoMenu();
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
  if (!token) {
    if (typeof window !== "undefined") {
      return getLocalDemoMenu();
    }
    return INITIAL_DEMO_MENU;
  }

  const res = await fetch("/api/restaurant/my-menu", {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const err = new Error(data.error || "Failed to load restaurant menu");
    (err as any).status = res.status;
    (err as any).code = data.code;
    (err as any).isDeleted = data.isDeleted;
    (err as any).isBanned = data.isBanned;
    (err as any).banReason = data.banReason;
    throw err;
  }

  return {
    restaurant: data.restaurant,
    categories: data.categories,
    items: data.items,
    analytics: data.analytics,
  };
}

export async function updateRestaurantHelper(updates: {
  name?: string;
  slug?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  hours?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  isPureVeg?: boolean;
  galleryPhotos?: string[];
  qrFg?: string;
  qrBg?: string;
  qrCorner?: string;
}): Promise<void> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    cur.restaurant = {
      ...cur.restaurant,
      ...(updates.name ? { name: updates.name } : {}),
      ...(updates.slug ? { slug: updates.slug } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.address !== undefined ? { address: updates.address } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.whatsapp !== undefined ? { whatsapp: updates.whatsapp } : {}),
      ...(updates.hours !== undefined ? { hours: updates.hours } : {}),
      ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
      ...(updates.coverUrl !== undefined ? { cover_url: updates.coverUrl } : {}),
      ...(updates.isPureVeg !== undefined ? { isPureVeg: updates.isPureVeg } : {}),
      ...(updates.galleryPhotos !== undefined ? { galleryPhotos: updates.galleryPhotos } : {}),
      ...(updates.qrFg ? { qr_fg: updates.qrFg } : {}),
      ...(updates.qrBg ? { qr_bg: updates.qrBg } : {}),
      ...(updates.qrCorner ? { qr_corner: updates.qrCorner } : {}),
    };
    saveLocalDemoMenu(cur);
    return;
  }

  const res = await fetch("/api/restaurant/update", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update restaurant profile");
  }
}

export const myMenuQuery = queryOptions({
  queryKey: ["my-menu"],
  queryFn: loadMyMenu,
  staleTime: 1000 * 60 * 5, // 5 minutes - Instant 0ms page transitions, eliminates DB roundtrips on tab switches
  gcTime: 1000 * 60 * 30, // 30 minutes in memory
  refetchOnWindowFocus: false, // Prevents reloading the entire database every time user focuses window
  retry: (failureCount, error: any) => {
    if (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.code === "ACCOUNT_DELETED" ||
      error?.code === "ACCOUNT_BANNED" ||
      error?.isDeleted ||
      error?.isBanned
    ) {
      return false;
    }
    return failureCount < 1;
  },
});

export interface UploadImageResult {
  url: string;
  summary: string;
  compressedBytes: number;
  originalBytes: number;
  savedPercent: number;
}

/** 
 * Uploads an image with aggressive client-side compression (downscaling + WebP 0.74).
 * Returns { url, summary, savedPercent, ... }.
 */
export async function uploadImage(
  file: File,
  type: "dish" | "logo" = "dish"
): Promise<UploadImageResult> {
  const isLogo = type === "logo";
  const compressed = await compressImage(file, {
    maxWidth: isLogo ? 400 : 800,
    maxHeight: isLogo ? 400 : 800,
    quality: 0.74,
  });

  return {
    url: compressed.dataUrl,
    summary: compressed.summary,
    compressedBytes: compressed.compressedBytes,
    originalBytes: compressed.originalBytes,
    savedPercent: compressed.savedPercent,
  };
}

export async function renameCategoryHelper(id: string, name: string): Promise<void> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    cur.categories = cur.categories.map((c) => (c.id === id ? { ...c, name } : c));
    saveLocalDemoMenu(cur);
    return;
  }

  const res = await fetch("/api/restaurant/category/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ id, name }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to rename category");
}

export async function addCategoryHelper(rid: string, name: string): Promise<Category> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      restaurant_id: rid,
      name,
      position: cur.categories.length,
      created_at: new Date().toISOString(),
    };
    cur.categories.push(newCat);
    saveLocalDemoMenu(cur);
    return newCat;
  }

  const res = await fetch("/api/restaurant/category/add", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to add category");
  return data.category;
}

export async function deleteCategoryHelper(id: string): Promise<void> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    cur.categories = cur.categories.filter((c) => c.id !== id);
    cur.items = cur.items.filter((i) => i.category_id !== id);
    saveLocalDemoMenu(cur);
    return;
  }

  const res = await fetch("/api/restaurant/category/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete category");
}

export async function addDishHelper(dish: {
  restaurant_id: string;
  category_id: string;
  name: string;
  price: number;
  description?: string | null | undefined;
  image_url?: string | null | undefined;
}): Promise<MenuItem> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      restaurant_id: dish.restaurant_id,
      category_id: dish.category_id,
      name: dish.name,
      description: dish.description || "",
      price: dish.price,
      image_url: dish.image_url || null,
      is_veg: true,
      available: true,
      position: cur.items.length,
      created_at: new Date().toISOString(),
    };
    cur.items.push(newItem);
    saveLocalDemoMenu(cur);
    return newItem;
  }

  const res = await fetch("/api/restaurant/item/add", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({
      categoryId: dish.category_id,
      name: dish.name,
      price: dish.price,
      description: dish.description,
      imageUrl: dish.image_url,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to add dish");
  return data.item;
}

export async function updateDishHelper(id: string, updates: Partial<MenuItem>): Promise<void> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    cur.items = cur.items.map((i) => (i.id === id ? { ...i, ...updates } : i));
    saveLocalDemoMenu(cur);
    return;
  }

  const res = await fetch("/api/restaurant/item/update", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({
      id,
      updates: {
        name: updates.name,
        price: updates.price,
        description: updates.description,
        imageUrl: updates.image_url,
        isVeg: updates.is_veg,
        available: updates.available,
        categoryId: updates.category_id,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to update dish");
}

export async function deleteDishHelper(id: string): Promise<void> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    cur.items = cur.items.filter((i) => i.id !== id);
    saveLocalDemoMenu(cur);
    return;
  }

  const res = await fetch("/api/restaurant/item/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete dish");
}

export async function toggleItemAvailableHelper(id: string): Promise<void> {
  if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
    const cur = getLocalDemoMenu();
    cur.items = cur.items.map((i) => (i.id === id ? { ...i, available: !i.available } : i));
    saveLocalDemoMenu(cur);
    return;
  }

  const res = await fetch("/api/restaurant/item/toggle-available", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to toggle availability");
}

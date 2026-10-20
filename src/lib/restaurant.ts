import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { slugify } from "./config";
import { compressImage } from "./image-compress";

export type Restaurant = Tables<"restaurants">;
export type Category = Tables<"categories">;
export type MenuItem = Tables<"menu_items">;

export type FullMenu = { restaurant: Restaurant; categories: Category[]; items: MenuItem[] };

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("menuly_demo_mode") === "true";
}

export function setDemoMode(active: boolean) {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem("menuly_demo_mode", "true");
  } else {
    localStorage.removeItem("menuly_demo_mode");
  }
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
    logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
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

export type PresetTemplate = {
  id: "dhaba" | "cafe" | "south_indian" | "street_food";
  title: string;
  badge: string;
  icon: string;
  description: string;
  categories: { id: string; name: string }[];
  items: {
    name: string;
    categoryIndex: number;
    price: number;
    description: string;
    image_url: string;
  }[];
};

export const STARTER_PRESETS: PresetTemplate[] = [
  {
    id: "dhaba",
    title: "North Indian Dhaba",
    badge: "Most Popular",
    icon: "🍛",
    description: "Dal Makhani, Paneer Tikka, Butter Naan, Jeera Rice & Gulab Jamun",
    categories: [
      { id: "dhaba-cat-1", name: "Starters & Tandoor" },
      { id: "dhaba-cat-2", name: "Main Course Gravies" },
      { id: "dhaba-cat-3", name: "Breads & Basmati Rice" },
      { id: "dhaba-cat-4", name: "Desserts & Chaas" },
    ],
    items: [
      {
        name: "Paneer Tikka Angara",
        categoryIndex: 0,
        price: 280,
        description: "Charcoal roasted cottage cheese marinated in hung curd and spices.",
        image_url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Dahi Ke Kebab",
        categoryIndex: 0,
        price: 240,
        description: "Melt-in-mouth spiced yogurt patties with crushed cardamom and coriander.",
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Dal Makhani Amritsari",
        categoryIndex: 1,
        price: 320,
        description: "Slow simmered black lentils cooked overnight with cream and desi butter.",
        image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Paneer Butter Masala",
        categoryIndex: 1,
        price: 340,
        description: "Fresh cottage cheese cubes in rich tomato, cashew nut and butter gravy.",
        image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Garlic Butter Naan",
        categoryIndex: 2,
        price: 70,
        description: "Clay oven leavened bread glazed with minced garlic and butter.",
        image_url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Jeera Basmati Pulao",
        categoryIndex: 2,
        price: 180,
        description: "Aromatic long-grain basmati rice tempered with roasted cumin.",
        image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Gulab Jamun with Rabdi",
        categoryIndex: 3,
        price: 110,
        description: "Warm golden khoya dumplings served with chilled thick rabdi.",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "cafe",
    title: "Cafe & Fast Food",
    badge: "Trending",
    icon: "☕",
    description: "Cold Brews, Grilled Sandwiches, Burgers, Fries & Brownies",
    categories: [
      { id: "cafe-cat-1", name: "Cold Brews & Beverages" },
      { id: "cafe-cat-2", name: "Artisanal Sandwiches & Burgers" },
      { id: "cafe-cat-3", name: "Loaded Fries & Starters" },
      { id: "cafe-cat-4", name: "Bakes & Desserts" },
    ],
    items: [
      {
        name: "Hazelnut Cold Coffee",
        categoryIndex: 0,
        price: 160,
        description: "Creamy espresso blend shaken with rich roasted hazelnut syrup.",
        image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Cheesy Paneer Tikka Sandwich",
        categoryIndex: 1,
        price: 180,
        description: "Toasted sourdough loaded with marinated cottage cheese, bell peppers & mozzarella.",
        image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Crispy Peri Peri Fries",
        categoryIndex: 2,
        price: 130,
        description: "Golden crisp french fries dusted with spicy African bird's eye chili seasoning.",
        image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Double Cheese Veg Burger",
        categoryIndex: 1,
        price: 190,
        description: "Crispy vegetable patty with double melted cheddar, jalapeños and secret sauce.",
        image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Warm Sizzling Walnut Brownie",
        categoryIndex: 3,
        price: 150,
        description: "Fudgy Belgian chocolate brownie served with vanilla ice cream and chocolate drizzle.",
        image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "south_indian",
    title: "South Indian Tiffin",
    badge: "Authentic",
    icon: "🥞",
    description: "Crispy Dosas, Idli-Vada combos, Filter Coffee & Uttapam",
    categories: [
      { id: "south-cat-1", name: "Crispy Dosas & Uttapams" },
      { id: "south-cat-2", name: "Steamed Idli & Medu Vada" },
      { id: "south-cat-3", name: "Meals & Traditional Rice" },
      { id: "south-cat-4", name: "Filter Kaapi & Drinks" },
    ],
    items: [
      {
        name: "Mysore Special Masala Dosa",
        categoryIndex: 0,
        price: 140,
        description: "Crispy golden crepe smeared with spicy red garlic chutney and spiced potato bhaji.",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Ghee Roast Paper Dosa",
        categoryIndex: 0,
        price: 160,
        description: "Ultra thin crisp cone dosa made with pure organic desi ghee.",
        image_url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Idli & Medu Vada Combo",
        categoryIndex: 1,
        price: 110,
        description: "Two melt-in-mouth steamed idlis and one crispy vada served with sambar and fresh coconut chutney.",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Authentic Degree Filter Kaapi",
        categoryIndex: 3,
        price: 50,
        description: "Traditional chicory-blended South Indian filter coffee frothed in a brass davarah.",
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "street_food",
    title: "Chaat & Street Food",
    badge: "Quick Bites",
    icon: "🫖",
    description: "Pav Bhaji, Chole Bhature, Sev Puri, Rolls & Kulhad Chai",
    categories: [
      { id: "street-cat-1", name: "Chaat & Snacks" },
      { id: "street-cat-2", name: "Hot Meals & Combos" },
      { id: "street-cat-3", name: "Frankie & Rolls" },
      { id: "street-cat-4", name: "Chai & Shikanji" },
    ],
    items: [
      {
        name: "Amul Butter Special Pav Bhaji",
        categoryIndex: 1,
        price: 150,
        description: "Spiced mashed vegetable curry slow-cooked on flat tawa with extra butter pav.",
        image_url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Amritsari Chole Bhature",
        categoryIndex: 1,
        price: 180,
        description: "Two fluffy golden bhatures served with spiced chickpea curry and pickled onions.",
        image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Mumbai Sev Puri Crisp",
        categoryIndex: 0,
        price: 90,
        description: "Crispy flat puris topped with potatoes, trio of chutneys and crunchy nylon sev.",
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Ginger Elaichi Kulhad Chai",
        categoryIndex: 3,
        price: 35,
        description: "Strong milk tea brewed with crushed ginger and green cardamom, served in clay kulhad.",
        image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];

export function applyStarterPreset(presetId: string): FullMenu {
  const current = getLocalDemoMenu();
  const preset = STARTER_PRESETS.find((p) => p.id === presetId) || STARTER_PRESETS[0]!;

  const rid = current.restaurant.id;
  const newCategories: Category[] = preset.categories.map((c, idx) => ({
    id: `cat-${preset.id}-${idx}-${Date.now()}`,
    restaurant_id: rid,
    name: c.name,
    position: idx,
    created_at: new Date().toISOString(),
  }));

  const fallbackCat: Category = newCategories[0] || {
    id: `cat-${Date.now()}`,
    restaurant_id: rid,
    name: "Main Course",
    position: 0,
    created_at: new Date().toISOString(),
  };

  const newItems: MenuItem[] = preset.items.map((it, idx) => {
    const cat = newCategories[it.categoryIndex] || fallbackCat;
    return {
      id: `item-${preset.id}-${idx}-${Date.now()}`,
      restaurant_id: rid,
      category_id: cat.id,
      name: it.name,
      description: it.description,
      price: it.price,
      image_url: it.image_url,
      is_veg: true,
      available: true,
      position: idx,
      created_at: new Date().toISOString(),
    };
  });

  const updated: FullMenu = {
    ...current,
    categories: newCategories,
    items: newItems,
  };
  saveLocalDemoMenu(updated);
  return updated;
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
      // If no token exists, fallback to demo menu for preview
      return getLocalDemoMenu();
    }
    throw new Error("Not signed in");
  }

  const res = await fetch("/api/restaurant/my-menu", {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to load restaurant menu");
  }

  return {
    restaurant: data.restaurant,
    categories: data.categories,
    items: data.items,
  };
}

export const myMenuQuery = queryOptions({ queryKey: ["my-menu"], queryFn: loadMyMenu });

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

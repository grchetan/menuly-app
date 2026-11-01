/**
 * Curated High-Resolution Restaurant Dining Ambience Banners
 * Provides instant preset selection for restaurant owners and aesthetic default
 * banners for community cards and storefront profiles.
 */

export interface BannerPreset {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
}

export const RESTAURANT_BANNER_PRESETS: BannerPreset[] = [
  {
    id: "fine-dining",
    title: "Fine Dining & Chandeliers",
    category: "Luxury Dining",
    url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "rooftop",
    title: "Rooftop Evening & Warm Lights",
    category: "Rooftop & Lounge",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "cozy-cafe",
    title: "Artisanal Coffee & Roastery",
    category: "Cafe & Bakery",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "royal-dhaba",
    title: "Royal Heritage & Clay Oven",
    category: "North Indian",
    url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "woodfire-bistro",
    title: "Wood-Fired Pizza & Bistro",
    category: "Italian & Continental",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "craft-burgers",
    title: "Gourmet Burgers & Grill",
    category: "Fast Casual & Diner",
    url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "french-bakery",
    title: "Patisserie, Cakes & Bakes",
    category: "Desserts & Bakery",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=75",
  },
  {
    id: "garden-patio",
    title: "Open-Air Garden & Terrace",
    category: "Terrace & Brunch",
    url: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1400&q=80",
    previewUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=400&q=75",
  },
];

/**
 * Returns a consistent, deterministic luxury banner for any restaurant
 * based on its unique seed (id, slug, or name).
 */
export function getDefaultBanner(seed?: string | null): string {
  const fallback = RESTAURANT_BANNER_PRESETS[0]!;
  if (!seed || !seed.trim()) {
    return fallback.url;
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % RESTAURANT_BANNER_PRESETS.length;
  const match = RESTAURANT_BANNER_PRESETS[index] ?? fallback;
  return match.url;
}

/**
 * Resolves an optimized, high-performance banner image URL.
 * Automatically handles WebP formatting and responsive dimension requests.
 */
export function getOptimizedBannerUrl(
  url?: string | null,
  fallbackSeed?: string | null,
  width: number = 1200
): string {
  const chosen = (url && url.trim()) || getDefaultBanner(fallbackSeed);

  // If Unsplash, ensure optimal WebP compression and dimension parameters
  if (chosen.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(chosen);
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "80");
      return parsed.toString();
    } catch {
      return chosen;
    }
  }

  return chosen;
}

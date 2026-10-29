import { prisma } from "../db";
import { sanitizeText } from "../security/sanitize";

export interface CommunityRestaurantSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string;
  hours: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isPureVeg: boolean;
  isFeatured: boolean;
  galleryPhotos: string[];
  categoryCount: number;
  dishCount: number;
  menuViews: number;
  profileVisits: number;
  createdAt: string;
}

export interface CommunityRestaurantDetail extends CommunityRestaurantSummary {
  phone: string | null;
  whatsapp: string | null;
  qrFg: string;
  qrBg: string;
  qrCorner: string;
  categories: Array<{
    id: string;
    name: string;
    itemCount: number;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      imageUrl: string | null;
      isVeg: boolean;
      available: boolean;
    }>;
  }>;
}

/**
 * 1. LIST COMMUNITY RESTAURANTS
 * Returns active, verified restaurants on Menuly with live menu & visit counts.
 */
export async function getCommunityRestaurants(params: {
  search?: string;
  city?: string;
  vegOnly?: boolean;
  sort?: "popular" | "views" | "visits" | "newest" | "name";
  limit?: number;
}): Promise<{
  restaurants: CommunityRestaurantSummary[];
  totalCount: number;
  featuredCount: number;
  totalDishesAcrossPlatform: number;
}> {
  const { search, city, vegOnly, sort = "popular", limit = 60 } = params;
  const cleanSearch = search ? search.trim().toLowerCase() : "";
  const cleanCity = city ? city.trim().toLowerCase() : "";

  // Base where clause: Active, non-deleted, with a verified non-banned owner
  const whereClause: any = {
    deletedAt: null,
    isActive: true,
    owner: {
      isVerified: true,
      deletedAt: null,
      isBanned: false,
    },
  };

  if (vegOnly) {
    whereClause.isPureVeg = true;
  }

  if (cleanCity) {
    whereClause.address = {
      contains: cleanCity,
      mode: "insensitive",
    };
  }

  if (cleanSearch) {
    whereClause.OR = [
      { name: { contains: cleanSearch, mode: "insensitive" } },
      { address: { contains: cleanSearch, mode: "insensitive" } },
      { description: { contains: cleanSearch, mode: "insensitive" } },
      { slug: { contains: cleanSearch, mode: "insensitive" } },
      {
        menuItems: {
          some: {
            name: { contains: cleanSearch, mode: "insensitive" },
          },
        },
      },
    ];
  }

  // Fetch from database with relations and counts
  const restaurants = await prisma.restaurant.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          categories: true,
          menuItems: true,
          qrScans: true,
        },
      },
    },
    take: Math.min(limit, 100),
  });

  // Map to clean public community format (Zero leak of private owner credentials)
  const mapped: CommunityRestaurantSummary[] = restaurants.map((r) => {
    // Parse city safely from address
    let extractedCity = "India";
    if (r.address) {
      const parts = r.address.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        extractedCity = parts[parts.length - 1] || "India";
      }
    }

    let gallery: string[] = [];
    if (Array.isArray(r.galleryPhotos)) {
      gallery = r.galleryPhotos.filter((p): p is string => typeof p === "string");
    }

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || null,
      address: r.address || null,
      city: extractedCity,
      hours: r.hours || "Mon–Sun, 10:00 AM – 11:00 PM",
      logoUrl: r.logoUrl || null,
      coverUrl: r.coverUrl || null,
      isPureVeg: r.isPureVeg,
      isFeatured: r.isFeatured,
      galleryPhotos: gallery,
      categoryCount: r._count.categories,
      dishCount: r._count.menuItems,
      menuViews: r._count.qrScans,
      profileVisits: r.profileVisits || 0,
      createdAt: r.createdAt.toISOString(),
    };
  });

  // Sort results
  mapped.sort((a, b) => {
    // Featured always on top if popular or newest
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }
    if (sort === "views") {
      return b.menuViews - a.menuViews;
    }
    if (sort === "visits") {
      return b.profileVisits - a.profileVisits;
    }
    if (sort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    // "popular" (Combined views + visits score)
    const scoreA = a.menuViews * 1.5 + a.profileVisits;
    const scoreB = b.menuViews * 1.5 + b.profileVisits;
    return scoreB - scoreA;
  });

  const totalDishes = mapped.reduce((acc, curr) => acc + curr.dishCount, 0);
  const featured = mapped.filter((r) => r.isFeatured).length;

  return {
    restaurants: mapped,
    totalCount: mapped.length,
    featuredCount: featured,
    totalDishesAcrossPlatform: totalDishes,
  };
}

/**
 * 2. GET COMMUNITY RESTAURANT BY SLUG (Full Storefront Profile)
 * Increments profileVisits in the database and returns public details.
 */
export async function getCommunityRestaurantBySlug(
  slug: string
): Promise<CommunityRestaurantDetail | null> {
  const cleanSlug = slug.toLowerCase().trim();

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: cleanSlug },
    include: {
      owner: {
        select: {
          isVerified: true,
          isBanned: true,
          deletedAt: true,
        },
      },
      categories: {
        orderBy: { position: "asc" },
        include: {
          items: {
            orderBy: { position: "asc" },
          },
        },
      },
      _count: {
        select: {
          categories: true,
          menuItems: true,
          qrScans: true,
        },
      },
    },
  });

  if (!restaurant || restaurant.deletedAt || !restaurant.isActive) {
    return null;
  }

  // Ensure owner is not banned or deleted
  if (restaurant.owner?.isBanned || restaurant.owner?.deletedAt) {
    return null;
  }

  // Atomically increment profileVisits counter in background
  prisma.restaurant
    .update({
      where: { id: restaurant.id },
      data: { profileVisits: { increment: 1 } },
    })
    .catch(() => {});

  let extractedCity = "India";
  if (restaurant.address) {
    const parts = restaurant.address.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      extractedCity = parts[parts.length - 1] || "India";
    }
  }

  let gallery: string[] = [];
  if (Array.isArray(restaurant.galleryPhotos)) {
    gallery = restaurant.galleryPhotos.filter((p): p is string => typeof p === "string");
  }

  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description || null,
    address: restaurant.address || null,
    city: extractedCity,
    hours: restaurant.hours || "Mon–Sun, 10:00 AM – 11:00 PM",
    phone: null, // Hidden for privacy reasons as requested
    whatsapp: null, // Hidden for privacy reasons as requested
    logoUrl: restaurant.logoUrl || null,
    coverUrl: restaurant.coverUrl || null,
    isPureVeg: restaurant.isPureVeg,
    isFeatured: restaurant.isFeatured,
    galleryPhotos: gallery,
    categoryCount: restaurant._count.categories,
    dishCount: restaurant._count.menuItems,
    menuViews: restaurant._count.qrScans,
    profileVisits: (restaurant.profileVisits || 0) + 1,
    qrFg: restaurant.qrFg || "#2e7d52",
    qrBg: restaurant.qrBg || "#ffffff",
    qrCorner: restaurant.qrCorner || "rounded",
    createdAt: restaurant.createdAt.toISOString(),
    categories: restaurant.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      itemCount: cat.items.length,
      items: cat.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        isVeg: item.isVeg,
        available: item.available,
      })),
    })),
  };
}

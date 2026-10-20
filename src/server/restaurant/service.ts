import { prisma } from "../db";
import { slugify } from "../../lib/config";
import { STARTER_PRESETS } from "../../lib/presets";

export interface RestaurantPayload {
  name: string;
  slug: string;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  hours?: string | null;
  logoUrl?: string | null;
  qrFg?: string;
  qrBg?: string;
  qrCorner?: string;
}

export async function getOrCreateUserRestaurant(userId: string, userEmail: string, userFullName?: string | null) {
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
    include: {
      categories: {
        orderBy: { position: "asc" },
      },
      menuItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!restaurant) {
    // Generate unique slug
    const cleanBase = slugify(userFullName || userEmail.split("@")[0] || "pureveg") || "pureveg";
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    let finalSlug = `${cleanBase}-${randomSuffix}`;

    // Ensure uniqueness
    const existing = await prisma.restaurant.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${cleanBase}-${Date.now().toString(36).slice(-4)}`;
    }

    const defaultName = userFullName
      ? `${userFullName}'s Restaurant`
      : "My Restaurant";

    restaurant = await prisma.restaurant.create({
      data: {
        ownerId: userId,
        name: defaultName,
        slug: finalSlug,
        planSlug: "starter",
        isPureVeg: true,
        hours: "Mon–Sun, 10:00 AM – 11:00 PM",
      },
      include: {
        categories: { orderBy: { position: "asc" } },
        menuItems: { orderBy: { position: "asc" } },
      },
    });
  }

  const analytics = await getRestaurantAnalytics(restaurant.id);

  return {
    restaurant: {
      id: restaurant.id,
      owner_id: restaurant.ownerId,
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.phone,
      whatsapp: restaurant.whatsapp,
      address: restaurant.address,
      hours: restaurant.hours,
      logo_url: restaurant.logoUrl,
      plan_slug: restaurant.planSlug,
      is_active: restaurant.isActive,
      is_pure_veg: restaurant.isPureVeg,
      qr_fg: restaurant.qrFg,
      qr_bg: restaurant.qrBg,
      qr_corner: restaurant.qrCorner,
      created_at: restaurant.createdAt.toISOString(),
      updated_at: restaurant.updatedAt.toISOString(),
    },
    categories: restaurant.categories.map((c) => ({
      id: c.id,
      restaurant_id: c.restaurantId,
      name: c.name,
      position: c.position,
      created_at: c.createdAt.toISOString(),
    })),
    items: restaurant.menuItems.map((item) => ({
      id: item.id,
      restaurant_id: item.restaurantId,
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      image_url: item.imageUrl,
      is_veg: item.isVeg,
      available: item.available,
      position: item.position,
      created_at: item.createdAt.toISOString(),
    })),
    analytics,
  };
}

export async function getRestaurantAnalytics(restaurantId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Execute telemetry queries concurrently in parallel
  const [totalScans, scansToday, tableScans, directVisits, pastScans] = await Promise.all([
    prisma.qrScan.count({ where: { restaurantId } }),
    prisma.qrScan.count({ where: { restaurantId, scannedAt: { gte: startOfToday } } }),
    prisma.qrScan.count({ where: { restaurantId, tableNumber: { not: null } } }),
    prisma.qrScan.count({ where: { restaurantId, tableNumber: null } }),
    prisma.qrScan.findMany({
      where: { restaurantId, scannedAt: { gte: sevenDaysAgo } },
      select: { scannedAt: true },
    }),
  ]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysMap = new Map<string, number>();
  const weeklyScansList: { day: string; date: string; scans: number; height: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayLabel = dayNames[d.getDay()]!;
    daysMap.set(dayKey, 0);
    weeklyScansList.push({
      day: dayLabel,
      date: dayKey,
      scans: 0,
      height: "8%",
    });
  }

  for (const s of pastScans) {
    const sDate = s.scannedAt;
    const key = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, "0")}-${String(sDate.getDate()).padStart(2, "0")}`;
    if (daysMap.has(key)) {
      daysMap.set(key, (daysMap.get(key) || 0) + 1);
    }
  }

  const maxScans = Math.max(...Array.from(daysMap.values()), 0);

  for (const item of weeklyScansList) {
    const count = daysMap.get(item.date) || 0;
    item.scans = count;
    if (maxScans > 0 && count > 0) {
      item.height = `${Math.max(16, Math.round((count / maxScans) * 100))}%`;
    } else {
      item.height = "8%";
    }
  }

  return {
    totalScans,
    scansToday,
    tableScans,
    directVisits,
    scansThisWeek: pastScans.length,
    weeklyScans: weeklyScansList,
  };
}

export async function applyPresetToRestaurant(userId: string, presetId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const preset = STARTER_PRESETS.find((p) => p.id === presetId) || STARTER_PRESETS[0]!;

  // 1. Clear existing items and categories
  await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });

  // 2. Insert new categories and items
  for (let idx = 0; idx < preset.categories.length; idx++) {
    const c = preset.categories[idx]!;
    const createdCat = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: c.name,
        position: idx,
      },
    });

    const itemsForCategory = preset.items.filter((item) => item.categoryIndex === idx);
    for (let itIdx = 0; itIdx < itemsForCategory.length; itIdx++) {
      const it = itemsForCategory[itIdx]!;
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: createdCat.id,
          name: it.name,
          price: it.price,
          description: it.description,
          imageUrl: it.image_url,
          isVeg: true,
          available: true,
          position: itIdx,
        },
      });
    }
  }

  return await getOrCreateUserRestaurant(userId, "");
}

export async function getTablesForRestaurant(userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) return [];

  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { tableNumber: "asc" },
  });

  return tables.map((t) => ({
    id: t.id,
    restaurant_id: t.restaurantId,
    table_number: t.tableNumber,
    label: t.label,
    scans_count: t.scansCount,
    created_at: t.createdAt.toISOString(),
  }));
}

export async function saveTableForRestaurant(
  userId: string,
  tableNumber: string,
  label?: string | null
) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const cleanNum = tableNumber.trim();
  if (!cleanNum) throw new Error("Table number is required.");

  const table = await prisma.restaurantTable.upsert({
    where: {
      restaurantId_tableNumber: {
        restaurantId: restaurant.id,
        tableNumber: cleanNum,
      },
    },
    update: {
      label: label?.trim() || null,
    },
    create: {
      restaurantId: restaurant.id,
      tableNumber: cleanNum,
      label: label?.trim() || null,
    },
  });

  return {
    id: table.id,
    restaurant_id: table.restaurantId,
    table_number: table.tableNumber,
    label: table.label,
    scans_count: table.scansCount,
    created_at: table.createdAt.toISOString(),
  };
}

export async function deleteTableForRestaurant(userId: string, id: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  await prisma.restaurantTable.deleteMany({
    where: { id, restaurantId: restaurant.id },
  });

  return { success: true };
}

export async function bulkCreateTablesForRestaurant(
  userId: string,
  count: number,
  prefix: string = "Table "
) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const total = Math.min(Math.max(1, count), 100);
  const created: any[] = [];

  for (let i = 1; i <= total; i++) {
    const tableNum = String(i);
    const label = `${prefix.trim()} ${i}`.trim();
    const t = await prisma.restaurantTable.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber: tableNum,
        },
      },
      update: { label },
      create: {
        restaurantId: restaurant.id,
        tableNumber: tableNum,
        label,
      },
    });
    created.push({
      id: t.id,
      restaurant_id: t.restaurantId,
      table_number: t.tableNumber,
      label: t.label,
      scans_count: t.scansCount,
      created_at: t.createdAt.toISOString(),
    });
  }

  return created;
}

export async function updateRestaurant(userId: string, data: Partial<RestaurantPayload>) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found for user.");
  }

  // If slug is being changed, ensure it's not taken by another restaurant
  if (data.slug && data.slug !== restaurant.slug) {
    const clean = slugify(data.slug);
    const existing = await prisma.restaurant.findUnique({ where: { slug: clean } });
    if (existing && existing.id !== restaurant.id) {
      throw new Error(`Menu link '${clean}' is already claimed by another restaurant.`);
    }
    data.slug = clean;
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.slug ? { slug: data.slug } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp?.trim() || null } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.hours !== undefined ? { hours: data.hours?.trim() || null } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl || null } : {}),
      ...(data.qrFg ? { qrFg: data.qrFg } : {}),
      ...(data.qrBg ? { qrBg: data.qrBg } : {}),
      ...(data.qrCorner ? { qrCorner: data.qrCorner } : {}),
    },
  });

  return updated;
}

export async function addCategory(userId: string, name: string) {
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const full = await getOrCreateUserRestaurant(userId, user?.email || "owner@menuly.app", user?.fullName);
    restaurant = await prisma.restaurant.findUnique({ where: { id: full.restaurant.id } });
  }
  if (!restaurant) throw new Error("Restaurant not found.");

  const currentCount = await prisma.category.count({
    where: { restaurantId: restaurant.id },
  });

  const cat = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: name.trim(),
      position: currentCount,
    },
  });

  return {
    id: cat.id,
    restaurant_id: cat.restaurantId,
    name: cat.name,
    position: cat.position,
    created_at: cat.createdAt.toISOString(),
  };
}

export async function renameCategory(userId: string, id: string, name: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const cat = await prisma.category.findFirst({
    where: { id, restaurantId: restaurant.id },
  });
  if (!cat) throw new Error("Category not found or unauthorized.");

  const updated = await prisma.category.update({
    where: { id },
    data: { name: name.trim() },
  });

  return updated;
}

export async function deleteCategory(userId: string, id: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const cat = await prisma.category.findFirst({
    where: { id, restaurantId: restaurant.id },
  });
  if (!cat) throw new Error("Category not found or unauthorized.");

  await prisma.category.delete({ where: { id } });
  return { success: true };
}

export async function addDish(
  userId: string,
  data: {
    categoryId: string;
    name: string;
    price: number;
    description?: string | null;
    imageUrl?: string | null;
    isVeg?: boolean;
  }
) {
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const full = await getOrCreateUserRestaurant(userId, user?.email || "owner@menuly.app", user?.fullName);
    restaurant = await prisma.restaurant.findUnique({ where: { id: full.restaurant.id } });
  }
  if (!restaurant) throw new Error("Restaurant not found.");

  // Resolve valid categoryId (guard against "__NEW__", invalid strings, deleted categories)
  let category = null;
  if (data.categoryId && data.categoryId !== "__NEW__") {
    category = await prisma.category.findFirst({
      where: { id: data.categoryId, restaurantId: restaurant.id },
    });
  }

  if (!category) {
    // Pick the first existing category for this restaurant
    category = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { position: "asc" },
    });
  }

  if (!category) {
    // If restaurant has zero categories, auto-create a default one
    category = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: "Main Menu",
        position: 0,
      },
    });
  }

  const currentCount = await prisma.menuItem.count({
    where: { restaurantId: restaurant.id },
  });

  const item = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: category.id,
      name: data.name.trim(),
      price: data.price,
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl || null,
      isVeg: data.isVeg ?? true,
      available: true,
      position: currentCount,
    },
  });

  return {
    id: item.id,
    restaurant_id: item.restaurantId,
    category_id: item.categoryId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    image_url: item.imageUrl,
    is_veg: item.isVeg,
    available: item.available,
    position: item.position,
    created_at: item.createdAt.toISOString(),
  };
}

export async function updateDish(
  userId: string,
  id: string,
  updates: {
    name?: string;
    price?: number;
    description?: string | null;
    imageUrl?: string | null;
    isVeg?: boolean;
    available?: boolean;
    categoryId?: string;
  }
) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: restaurant.id },
  });
  if (!item) throw new Error("Item not found or unauthorized.");

  let validatedCategoryId: string | undefined = undefined;
  if (updates.categoryId && updates.categoryId !== "__NEW__") {
    const validCat = await prisma.category.findFirst({
      where: { id: updates.categoryId, restaurantId: restaurant.id },
    });
    if (validCat) {
      validatedCategoryId = validCat.id;
    }
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.price !== undefined ? { price: updates.price } : {}),
      ...(updates.description !== undefined ? { description: updates.description?.trim() || null } : {}),
      ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl || null } : {}),
      ...(updates.isVeg !== undefined ? { isVeg: updates.isVeg } : {}),
      ...(updates.available !== undefined ? { available: updates.available } : {}),
      ...(validatedCategoryId ? { categoryId: validatedCategoryId } : {}),
    },
  });

  return {
    id: updated.id,
    restaurant_id: updated.restaurantId,
    category_id: updated.categoryId,
    name: updated.name,
    description: updated.description,
    price: Number(updated.price),
    image_url: updated.imageUrl,
    is_veg: updated.isVeg,
    available: updated.available,
    position: updated.position,
    created_at: updated.createdAt.toISOString(),
  };
}

export async function deleteDish(userId: string, id: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: restaurant.id },
  });
  if (!item) throw new Error("Item not found or unauthorized.");

  await prisma.menuItem.delete({ where: { id } });
  return { success: true };
}

export async function toggleDishAvailable(userId: string, id: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: restaurant.id },
  });
  if (!item) throw new Error("Item not found.");

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { available: !item.available },
  });

  return { id: updated.id, available: updated.available };
}

export async function getPublicRestaurantMenu(slug: string, tableNumber?: string, clientIp?: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: slug.toLowerCase().trim() },
    include: {
      categories: {
        orderBy: { position: "asc" },
      },
      menuItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    return null;
  }

  // Record scan in background
  try {
    await prisma.qrScan.create({
      data: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber || null,
        ipHash: clientIp ? Buffer.from(clientIp).toString("base64").slice(0, 16) : null,
      },
    });
  } catch {
    // Non-blocking scan metric
  }

  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.phone,
      whatsapp: restaurant.whatsapp,
      address: restaurant.address,
      hours: restaurant.hours,
      logo_url: restaurant.logoUrl,
      is_pure_veg: restaurant.isPureVeg,
      qr_fg: restaurant.qrFg,
      qr_bg: restaurant.qrBg,
      qr_corner: restaurant.qrCorner,
      created_at: restaurant.createdAt.toISOString(),
      updated_at: restaurant.updatedAt.toISOString(),
    },
    categories: restaurant.categories.map((c) => ({
      id: c.id,
      restaurant_id: c.restaurantId,
      name: c.name,
      position: c.position,
      created_at: c.createdAt.toISOString(),
    })),
    items: restaurant.menuItems.map((item) => ({
      id: item.id,
      restaurant_id: item.restaurantId,
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      image_url: item.imageUrl,
      is_veg: item.isVeg,
      available: item.available,
      position: item.position,
      created_at: item.createdAt.toISOString(),
    })),
  };
}

export async function getAllRestaurantsForAdmin() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      owner: {
        select: {
          fullName: true,
          email: true,
          phone: true,
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
    orderBy: { createdAt: "desc" },
  });

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    ownerName: r.owner?.fullName || "Owner",
    ownerEmail: r.owner?.email || "N/A",
    phone: r.owner?.phone || r.phone || "",
    city: r.address ? r.address.split(",").slice(-1)[0]?.trim() || "India" : "India",
    dishCount: r._count.menuItems,
    categoryCount: r._count.categories,
    plan: r.planSlug as "starter" | "pro" | "enterprise",
    status: (r.isActive ? "active" : "suspended") as "active" | "setup" | "suspended",
    qrScans: r._count.qrScans,
    joinedDate: r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  }));
}

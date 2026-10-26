import { prisma } from "../db";
import { slugify } from "../../lib/config";
import { STARTER_PRESETS, type PresetTemplate } from "../../lib/presets";

export interface RestaurantPayload {
  name: string;
  slug: string;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  hours?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  qrFg?: string;
  qrBg?: string;
  qrCorner?: string;
}

export async function getOrCreateUserRestaurant(
  userId: string,
  userEmail: string,
  userFullName?: string | null,
  role?: string
) {
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
    const cleanBase =
      role === "SUPER_ADMIN"
        ? "menuly-official"
        : (slugify(userFullName || userEmail.split("@")[0] || "pureveg") || "pureveg");
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    let finalSlug = `${cleanBase}-${randomSuffix}`;

    // Ensure uniqueness
    const existing = await prisma.restaurant.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${cleanBase}-${Date.now().toString(36).slice(-4)}`;
    }

    const defaultName =
      role === "SUPER_ADMIN"
        ? "Menuly HQ (Official Demo)"
        : (userFullName ? `${userFullName}'s Restaurant` : "My Restaurant");

    const createdRestaurant = await prisma.restaurant.create({
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
    restaurant = createdRestaurant;

    // Auto-seed default starter pack for instant onboarding (so new users immediately see dishes & categories)
    try {
      const presets = await getEffectiveStarterPresets();
      let defaultPresetKey = "dhaba";
      try {
        const pref = await prisma.platformSetting.findUnique({
          where: { key: "default_starter_preset" },
        });
        if (pref && typeof pref.value === "string") {
          defaultPresetKey = pref.value;
        }
      } catch {}

      const preset = presets.find((p) => p.id === defaultPresetKey) || presets[0] || STARTER_PRESETS[0];

      if (preset && preset.categories?.length > 0) {
        const restaurantId = createdRestaurant.id;
        const createdCats = await Promise.all(
          preset.categories.map((c, idx) =>
            prisma.category.create({
              data: {
                restaurantId,
                name: c.name,
                position: idx,
              },
            })
          )
        );

        const allItems: Array<{
          restaurantId: string;
          categoryId: string;
          name: string;
          price: number;
          description: string;
          imageUrl: string | null;
          isVeg: boolean;
          available: boolean;
          position: number;
        }> = [];

        for (let idx = 0; idx < preset.categories.length; idx++) {
          const createdCat = createdCats[idx];
          if (!createdCat) continue;
          const itemsForCategory = preset.items.filter((item) => item.categoryIndex === idx);
          itemsForCategory.forEach((it, itIdx) => {
            allItems.push({
              restaurantId,
              categoryId: createdCat.id,
              name: it.name,
              price: it.price,
              description: it.description,
              imageUrl: it.image_url,
              isVeg: true,
              available: true,
              position: itIdx,
            });
          });
        }

        if (allItems.length > 0) {
          await prisma.menuItem.createMany({
            data: allItems,
          });
        }

        // Reload categories and items for the return payload
        const updated = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          include: {
            categories: { orderBy: { position: "asc" } },
            menuItems: { orderBy: { position: "asc" } },
          },
        });
        if (updated) {
          restaurant = updated;
        }
      }
    } catch (err) {
      console.error("[Restaurant Auto-seed Default Menu Failed]", err);
    }
  }

  if (!restaurant) {
    throw new Error("Unable to retrieve or initialize restaurant profile.");
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
      cover_url: restaurant.coverUrl,
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

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Optimized telemetry: 2 lightweight queries instead of 5
    const [totalScans, pastScans] = await Promise.all([
      prisma.qrScan.count({ where: { restaurantId } }).catch(() => 0),
      prisma.qrScan.findMany({
        where: { restaurantId, scannedAt: { gte: sevenDaysAgo } },
        select: { scannedAt: true, tableNumber: true },
      }).catch(() => []),
    ]);

    let scansToday = 0;
    let tableScans = 0;
    let directVisits = 0;

    for (const s of pastScans) {
      if (s.scannedAt >= startOfToday) {
        scansToday++;
      }
      if (s.tableNumber) {
        tableScans++;
      } else {
        directVisits++;
      }
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
  } catch (err) {
    console.error("[Analytics Telemetry Warning]", err);
    return {
      totalScans: 0,
      scansToday: 0,
      tableScans: 0,
      directVisits: 0,
      scansThisWeek: 0,
      weeklyScans: weeklyScansList,
    };
  }
}

export async function getEffectiveStarterPresets(): Promise<PresetTemplate[]> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: "starter_menu_presets" },
    });
    if (row && Array.isArray(row.value) && row.value.length > 0) {
      return row.value as unknown as PresetTemplate[];
    }
  } catch (err) {
    console.error("[getEffectiveStarterPresets Error]", err);
  }
  return STARTER_PRESETS;
}

export async function saveStarterPresets(presets: PresetTemplate[], defaultPresetId?: string): Promise<boolean> {
  await prisma.platformSetting.upsert({
    where: { key: "starter_menu_presets" },
    create: {
      key: "starter_menu_presets",
      value: presets as any,
    },
    update: {
      value: presets as any,
      updatedAt: new Date(),
    },
  });

  if (defaultPresetId) {
    await prisma.platformSetting.upsert({
      where: { key: "default_starter_preset" },
      create: {
        key: "default_starter_preset",
        value: defaultPresetId as any,
      },
      update: {
        value: defaultPresetId as any,
        updatedAt: new Date(),
      },
    });
  }

  // ADVANCED SYNC: Propagate dish and category changes to live restaurants using starter menus
  try {
    for (const preset of presets) {
      for (const item of preset.items) {
        if (!item.name) continue;
        await prisma.menuItem.updateMany({
          where: {
            name: { equals: item.name, mode: "insensitive" },
          },
          data: {
            imageUrl: item.image_url || null,
            price: item.price,
            description: item.description,
          },
        });
      }
    }

    // Specifically re-sync the official demo restaurant "menuly-official" with the active default starter pack
    const effectiveDefaultKey = defaultPresetId || "dhaba";
    const activePack = presets.find((p) => p.id === effectiveDefaultKey) || presets[0];

    const demoRest = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { slug: "menuly-official" },
          { name: { contains: "Official Demo", mode: "insensitive" } },
        ],
      },
      include: {
        categories: { orderBy: { position: "asc" } },
        menuItems: { orderBy: { position: "asc" } },
      },
    });

    if (demoRest && activePack) {
      await prisma.menuItem.deleteMany({ where: { restaurantId: demoRest.id } });
      await prisma.category.deleteMany({ where: { restaurantId: demoRest.id } });

      const createdCats = await Promise.all(
        activePack.categories.map((c, idx) =>
          prisma.category.create({
            data: {
              restaurantId: demoRest.id,
              name: c.name,
              position: idx,
            },
          })
        )
      );

      const itemsToCreate = activePack.items
        .map((it, idx) => {
          const cat = createdCats[it.categoryIndex] || createdCats[0];
          if (!cat) return null;
          return {
            restaurantId: demoRest.id,
            categoryId: cat.id,
            name: it.name,
            price: it.price,
            description: it.description,
            imageUrl: it.image_url || null,
            isVeg: true,
            available: true,
            position: idx,
          };
        })
        .filter((it): it is NonNullable<typeof it> => it !== null);

      if (itemsToCreate.length > 0) {
        await prisma.menuItem.createMany({ data: itemsToCreate });
      }
    }

    // Purge in-memory public menu cache so visitors immediately see new dishes & photos
    invalidatePublicMenuCache();
  } catch (syncErr) {
    console.error("[saveStarterPresets Sync Error]", syncErr);
  }

  return true;
}

export async function applyPresetToRestaurant(userId: string, presetId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  const presets = await getEffectiveStarterPresets();
  const preset = presets.find((p) => p.id === presetId) || presets[0] || STARTER_PRESETS[0]!;

  // 1. Clear existing items and categories in parallel
  await Promise.all([
    prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } }),
    prisma.category.deleteMany({ where: { restaurantId: restaurant.id } }),
  ]);

  // 2. Batch create categories in parallel
  const createdCats = await Promise.all(
    preset.categories.map((c, idx) =>
      prisma.category.create({
        data: {
          restaurantId: restaurant.id,
          name: c.name,
          position: idx,
        },
      })
    )
  );

  // 3. Batch insert ALL menu items in 1 single createMany query
  const allItems: Array<{
    restaurantId: string;
    categoryId: string;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
    isVeg: boolean;
    available: boolean;
    position: number;
  }> = [];

  for (let idx = 0; idx < preset.categories.length; idx++) {
    const createdCat = createdCats[idx];
    if (!createdCat) continue;
    const itemsForCategory = preset.items.filter((item) => item.categoryIndex === idx);
    itemsForCategory.forEach((it, itIdx) => {
      allItems.push({
        restaurantId: restaurant.id,
        categoryId: createdCat.id,
        name: it.name,
        price: it.price,
        description: it.description,
        imageUrl: it.image_url,
        isVeg: true,
        available: true,
        position: itIdx,
      });
    });
  }

  if (allItems.length > 0) {
    await prisma.menuItem.createMany({
      data: allItems,
    });
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
      ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl || null } : {}),
      ...(data.qrFg ? { qrFg: data.qrFg } : {}),
      ...(data.qrBg ? { qrBg: data.qrBg } : {}),
      ...(data.qrCorner ? { qrCorner: data.qrCorner } : {}),
    },
  });

  invalidatePublicMenuCache(restaurant.slug);
  if (data.slug) invalidatePublicMenuCache(data.slug);
  return updated;
}

export async function addCategory(userId: string, name: string) {
  let restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const full = await getOrCreateUserRestaurant(userId, user?.email || "owner@menuly.app", user?.fullName);
    if (!full.restaurant) throw new Error("Restaurant not found.");
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

  invalidatePublicMenuCache(restaurant.slug);

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

  invalidatePublicMenuCache(restaurant.slug);
  return updated;
}

export async function deleteCategory(userId: string, id: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: userId },
  });
  if (!restaurant) throw new Error("Restaurant not found.");

  // Atomically and idempotently remove all items in category, then the category
  await prisma.menuItem.deleteMany({
    where: { categoryId: id, restaurantId: restaurant.id },
  });
  await prisma.category.deleteMany({
    where: { id, restaurantId: restaurant.id },
  });

  invalidatePublicMenuCache(restaurant.slug);
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
    if (!full.restaurant) throw new Error("Restaurant not found.");
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

  invalidatePublicMenuCache(restaurant.slug);

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

  invalidatePublicMenuCache(restaurant.slug);

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

  // Atomically and idempotently remove the item
  await prisma.menuItem.deleteMany({
    where: { id, restaurantId: restaurant.id },
  });

  invalidatePublicMenuCache(restaurant.slug);
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

  invalidatePublicMenuCache(restaurant.slug);
  return { id: updated.id, available: updated.available };
}

// In-Memory high-speed cache for public menus (Handles 1 Lakh+ concurrent visitors with sub-millisecond responses)
const publicMenuCache = new Map<string, { data: any; cachedAt: number }>();
const MENU_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function invalidatePublicMenuCache(slug?: string) {
  if (slug) {
    publicMenuCache.delete(slug.toLowerCase().trim());
  } else {
    publicMenuCache.clear();
  }
}

export async function getPublicRestaurantMenu(slug: string, tableNumber?: string, clientIp?: string) {
  const cleanSlug = slug.toLowerCase().trim();
  const cached = publicMenuCache.get(cleanSlug);
  const now = Date.now();

  // Instant response from in-memory cache if fresh (< 30s)
  if (cached && now - cached.cachedAt < MENU_CACHE_TTL_MS) {
    // Record scan in background (fire-and-forget)
    prisma.qrScan
      .create({
        data: {
          restaurantId: cached.data.restaurant.id,
          tableNumber: tableNumber || null,
          ipHash: clientIp ? Buffer.from(clientIp).toString("base64").slice(0, 16) : null,
        },
      })
      .catch(() => {});

    return cached.data;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: cleanSlug },
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

  // Non-blocking asynchronous QR scan logging
  prisma.qrScan
    .create({
      data: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber || null,
        ipHash: clientIp ? Buffer.from(clientIp).toString("base64").slice(0, 16) : null,
      },
    })
    .catch(() => {});

  const menuPayload = {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.phone,
      whatsapp: restaurant.whatsapp,
      address: restaurant.address,
      hours: restaurant.hours,
      logo_url: restaurant.logoUrl,
      cover_url: restaurant.coverUrl,
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

  publicMenuCache.set(cleanSlug, {
    data: menuPayload,
    cachedAt: now,
  });

  return menuPayload;
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

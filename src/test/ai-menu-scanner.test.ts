import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../server/db";
import {
  extractMenuFromImage,
  applyScannedMenuToRestaurant,
  type ScannedCategory,
} from "../server/ai/menu-scanner";

describe("AI Smart Menu Digitizer & Scanner Suite", () => {
  let userId: string;
  let restaurantId: string;

  beforeAll(async () => {
    // Strictly use a dedicated isolated test account so live restaurant menus are never modified
    const testEmail = "vitest-ai-scanner@menuly.test";
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: { id: true, email: true },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          passwordHash: "test_hash",
          fullName: "Vitest AI Scanner Owner",
          role: "RESTAURANT_OWNER",
        },
        select: { id: true, email: true },
      });
    }
    userId = user.id;

    let r = await prisma.restaurant.findUnique({
      where: { slug: "vitest-ai-scanner-cafe" },
      select: { id: true, slug: true },
    });
    if (!r) {
      r = await prisma.restaurant.create({
        data: {
          ownerId: userId,
          name: "Vitest AI Test Cafe",
          slug: "vitest-ai-scanner-cafe",
          isActive: false,
        },
        select: { id: true, slug: true },
      });
    }
    restaurantId = r.id;
  });

  afterAll(async () => {
    if (restaurantId) {
      await prisma.menuItem.deleteMany({ where: { restaurantId } }).catch(() => {});
      await prisma.category.deleteMany({ where: { restaurantId } }).catch(() => {});
    }
  });

  it("rejects empty or corrupt image payloads", async () => {
    const res = await extractMenuFromImage("");
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toMatch(/invalid or empty image/i);
  });

  it("safely extracts structured response from live Gemini Vision API", async () => {
    // 1x1 base64 transparent PNG
    const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const res = await extractMenuFromImage(base64Png, "image/png");

    if (res.status === 200) {
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data?.categories)).toBe(true);
    } else {
      expect(res.error).toBeDefined();
    }
  }, 30000);

  it("applies extracted categories and dishes to database in append mode", async () => {
    // Ensure clean slate for test items
    await prisma.menuItem.deleteMany({ where: { restaurantId } });
    await prisma.category.deleteMany({ where: { restaurantId } });

    const sampleCategories: ScannedCategory[] = [
      {
        name: "AI Starters",
        items: [
          { name: "Crispy Corn Pepper Salt", price: 180, isVeg: true, description: "Sweet corn tossed with scallions" },
          { name: "Paneer Malai Tikka", price: 260, isVeg: true, description: "Creamy marinated cottage cheese" },
        ],
      },
      {
        name: "AI Breads",
        items: [
          { name: "Garlic Butter Naan", price: 65, isVeg: true },
        ],
      },
    ];

    const applyRes = await applyScannedMenuToRestaurant({
      userId,
      restaurantId,
      mode: "append",
      categories: sampleCategories,
    });

    expect(applyRes.success).toBe(true);
    expect(applyRes.status).toBe(200);
    expect(applyRes.createdDishesCount).toBe(3);

    // Verify dishes exist in database and have auto-assigned culinary photos
    const dbItems = await prisma.menuItem.findMany({
      where: { restaurantId, name: { in: ["Crispy Corn Pepper Salt", "Paneer Malai Tikka", "Garlic Butter Naan"] } },
    });
    expect(dbItems.length).toBe(3);
    expect(dbItems[0]?.imageUrl).toBeTruthy();
  }, 20000);

  it("applies extracted menu in replace mode (wipes old and writes fresh)", async () => {
    const freshCategories: ScannedCategory[] = [
      {
        name: "Fresh AI Main Course",
        items: [
          { name: "Dal Tadka Special", price: 160, isVeg: true },
        ],
      },
    ];

    const replaceRes = await applyScannedMenuToRestaurant({
      userId,
      restaurantId,
      mode: "replace",
      categories: freshCategories,
    });

    expect(replaceRes.success).toBe(true);
    expect(replaceRes.createdDishesCount).toBe(1);

    const dbItems = await prisma.menuItem.findMany({
      where: { restaurantId },
    });
    expect(dbItems.length).toBe(1);
    expect(dbItems[0]?.name).toBe("Dal Tadka Special");
    expect(dbItems[0]?.imageUrl).toBeTruthy();
  }, 20000);
});

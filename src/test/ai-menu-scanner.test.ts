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
    // Pick an existing user and restaurant or create test records
    let user = await prisma.user.findFirst({ select: { id: true, email: true } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "ai-scanner-test@menuly.app",
          passwordHash: "test_hash",
          fullName: "AI Scanner Test Owner",
          role: "RESTAURANT_OWNER",
        },
        select: { id: true, email: true },
      });
    }
    userId = user.id;

    let r = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true, slug: true },
    });
    if (!r) {
      r = await prisma.restaurant.create({
        data: {
          ownerId: userId,
          name: "AI Test Cafe",
          slug: "ai-test-cafe-" + Date.now(),
        },
        select: { id: true, slug: true },
      });
    }
    restaurantId = r.id;
  });

  afterAll(async () => {
    // Clean up test data if needed
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

    expect(res.status).toBe(200);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data?.categories)).toBe(true);
  }, 25000);

  it("applies extracted categories and dishes to database in append mode", async () => {
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

    // Verify dishes exist in database
    const dbItems = await prisma.menuItem.findMany({
      where: { restaurantId, name: { in: ["Crispy Corn Pepper Salt", "Paneer Malai Tikka", "Garlic Butter Naan"] } },
    });
    expect(dbItems.length).toBe(3);
  });

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
  });
});

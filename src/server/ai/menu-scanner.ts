import { prisma } from "../db";
import { sanitizeText, sanitizePrice } from "../security/sanitize";
import { invalidatePublicMenuCache, invalidateUserRestaurantCache } from "../restaurant/service";
import { getSmartDishImageUrl } from "../../lib/dish-images";

export interface ScannedMenuItem {
  name: string;
  description?: string | null;
  price: number;
  isVeg: boolean;
  imageUrl?: string | null;
}

export interface ScannedCategory {
  name: string;
  items: ScannedMenuItem[];
}

export interface ScannedMenuResult {
  restaurantName?: string | null;
  categories: ScannedCategory[];
  totalDishes: number;
}

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

/**
 * Extracts structured categories, dishes, prices, and veg status from a menu card photo using Google Gemini Vision.
 */
export async function extractMenuFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<{ success: boolean; status: number; error?: string; data?: ScannedMenuResult }> {
  const rawApiKey = process.env["GEMINI_API_KEY"];
  const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, "").trim() : "";

  if (!apiKey) {
    return {
      success: false,
      status: 500,
      error: "Gemini AI API key not configured. Please add GEMINI_API_KEY in .env.",
    };
  }

  // Strip data URL scheme prefix if present (e.g. "data:image/jpeg;base64,...")
  let cleanBase64 = imageBase64;
  let resolvedMime = mimeType;
  const dataUrlMatch = imageBase64.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
  if (dataUrlMatch && dataUrlMatch[1] && dataUrlMatch[2]) {
    resolvedMime = dataUrlMatch[1];
    cleanBase64 = dataUrlMatch[2];
  }

  if (!cleanBase64 || cleanBase64.length < 50) {
    return {
      success: false,
      status: 400,
      error: "Invalid or empty image payload. Please upload a clear photo of your menu card.",
    };
  }

  const systemPrompt = `You are a professional restaurant menu digitizer and culinary data extractor.
Analyze this photo of a restaurant menu card, brochure, signboard, or rate list.
Extract all dishes, sections/categories, prices in Indian Rupees (INR), and dietary types (pure vegetarian vs non-vegetarian).

RULES FOR EXTRACTION:
1. "restaurantName": Extract the restaurant or cafe name if clearly printed at the top/cover; otherwise null.
2. "categories": Group dishes into their printed sections (e.g., "Starters", "Tandoori Special", "Main Course", "Paneer Delicacies", "Dal & Rice", "Breads / Roti", "Beverages & Drinks", "Desserts"). If no explicit category is printed, organize logically.
3. For each dish in "items":
   - "name": Clean culinary dish name (e.g., "Paneer Butter Masala", "Dal Makhani", "Butter Naan"). Remove leading numbers, bullet points, asterisks, or dashes.
   - "description": Short description or ingredient line if printed under the dish; otherwise empty string or null.
   - "price": Numerical price as a number.
     * If the menu is printed with full rupee amounts (e.g. 240, 180, 50, "250/-"), extract that full integer number.
     * If the menu has decimal prices like 2.5, 3.0, 2.9, extract the numerical value.
     * If prices are listed as Half/Full like "120 / 220" or "H 120 F 220", extract the Full/higher price as the standard price.
     * If no price is listed, default to 0.
   - "isVeg": boolean. Strictly determine vegetarian vs non-vegetarian:
     * TRUE (Vegetarian): Paneer, cheese, margherita, veg pizza, veg burger, potato, aloo, mushroom, dal, lentils, chana, rajma, soya chaap, sweet corn, vegetables, roti, naan, rice, curd, chaas, desserts, green dot/mark.
     * FALSE (Non-Vegetarian): Chicken, mutton, lamb, fish, prawn, shrimp, seafood, egg, beef, pork, bacon, ham, pepperoni, sausage, hotdog, meat bolognese, red/brown dot or non-veg mark.
     * If ambiguous, default to true.
4. Output MUST BE valid JSON adhering to the exact schema with NO trailing commas, NO markdown wrappers, and pure JSON output.`;

  const requestPayload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: resolvedMime,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson?.error?.message || `HTTP ${res.status}`;
        console.warn(`[AI Menu Scanner] Model ${modelName} returned error:`, lastError);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = "AI returned an empty response";
        continue;
      }

      // Clean markdown code blocks if present
      const cleanedJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanedJson);

      const categoriesRaw = Array.isArray(parsed?.categories) ? parsed.categories : [];
      let totalDishes = 0;

      const sanitizedCategories: ScannedCategory[] = categoriesRaw
        .map((cat: any) => {
          const catName = sanitizeText(cat?.name || "General Menu", 80);
          const rawItems = Array.isArray(cat?.items) ? cat.items : [];
          const items: ScannedMenuItem[] = rawItems
            .map((it: any) => {
              const name = sanitizeText(it?.name || "", 120);
              if (!name) return null;
              const price = sanitizePrice(it?.price);
              const description = it?.description ? sanitizeText(it.description, 400) : null;
              const isVeg = it?.isVeg !== false;
              totalDishes++;
              const imageUrl = (typeof it?.imageUrl === "string" && it.imageUrl.trim())
                ? it.imageUrl.trim()
                : getSmartDishImageUrl(name, catName, isVeg);
              return { name, description, price, isVeg, imageUrl };
            })
            .filter((it: ScannedMenuItem | null): it is ScannedMenuItem => it !== null);

          return { name: catName, items };
        })
        .filter((cat: ScannedCategory) => cat.items.length > 0);

      return {
        success: true,
        status: 200,
        data: {
          restaurantName: parsed?.restaurantName ? sanitizeText(parsed.restaurantName, 120) : null,
          categories: sanitizedCategories,
          totalDishes,
        },
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[AI Menu Scanner] Error calling model ${modelName}:`, err);
    }
  }

  return {
    success: false,
    status: 502,
    error: `AI Menu extraction failed: ${lastError || "Could not read menu text clearly. Please upload a brighter or clearer photo."}`,
  };
}

/**
 * Saves or appends extracted categories and dishes into the restaurant's live database.
 */
export async function applyScannedMenuToRestaurant(params: {
  userId: string;
  restaurantId: string;
  mode: "append" | "replace";
  categories: ScannedCategory[];
}): Promise<{
  success: boolean;
  status: number;
  error?: string;
  createdCategoriesCount?: number;
  createdDishesCount?: number;
}> {
  const { userId, restaurantId, mode, categories } = params;

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return { success: false, status: 400, error: "No categories or dishes to import." };
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  });

  if (!restaurant) {
    return { success: false, status: 404, error: "Restaurant not found or unauthorized." };
  }

  let totalCategoriesCreated = 0;
  let totalDishesCreated = 0;

  await prisma.$transaction(async (tx) => {
    if (mode === "replace") {
      // Clean slate: delete all existing dishes & categories for this restaurant
      await tx.menuItem.deleteMany({ where: { restaurantId } });
      await tx.category.deleteMany({ where: { restaurantId } });
    }

    // Fetch existing categories to avoid duplicates in "append" mode
    const existingCats = await tx.category.findMany({
      where: { restaurantId },
      orderBy: { position: "asc" },
    });

    const categoryMap = new Map<string, string>();
    for (const c of existingCats) {
      categoryMap.set(c.name.toLowerCase().trim(), c.id);
    }

    let nextCategoryPos = existingCats.length;

    for (const cat of categories) {
      const cleanCatName = sanitizeText(cat.name, 80) || "General Menu";
      const key = cleanCatName.toLowerCase().trim();

      let targetCatId = categoryMap.get(key);

      if (!targetCatId) {
        const createdCat = await tx.category.create({
          data: {
            restaurantId,
            name: cleanCatName,
            position: nextCategoryPos++,
          },
        });
        targetCatId = createdCat.id;
        categoryMap.set(key, targetCatId);
        totalCategoriesCreated++;
      }

      // Insert dishes under targetCatId
      const itemsToCreate = (cat.items || []).map((it, idx) => {
        totalDishesCreated++;
        const resolvedImage = (typeof it.imageUrl === "string" && it.imageUrl.trim())
          ? it.imageUrl.trim()
          : getSmartDishImageUrl(it.name, cat.name, it.isVeg);
        return {
          restaurantId,
          categoryId: targetCatId!,
          name: sanitizeText(it.name, 120) || "Dish",
          description: it.description ? sanitizeText(it.description, 400) : null,
          price: Math.max(0, Number(it.price) || 0),
          imageUrl: resolvedImage,
          isVeg: it.isVeg !== false,
          available: true,
          position: idx,
        };
      });

      if (itemsToCreate.length > 0) {
        await tx.menuItem.createMany({
          data: itemsToCreate,
        });
      }
    }
  });

  // Bust caches so live digital menu reflects the imported dishes instantly
  invalidatePublicMenuCache(restaurant.slug);
  invalidateUserRestaurantCache(userId);

  return {
    success: true,
    status: 200,
    createdCategoriesCount: totalCategoriesCreated,
    createdDishesCount: totalDishesCreated,
  };
}

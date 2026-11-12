import { prisma } from "../db";
import type {
  ShopProduct,
  ShopOrder,
  ShopOrderStatus,
  ShopReview,
  ShopShippingAddress,
  ShopOrderItem,
} from "../../lib/shop-types";

// Key constants for PlatformSetting JSON storage
const SETTING_KEY_PRODUCTS = "shop_products";
const SETTING_KEY_ORDERS = "shop_orders";
const SETTING_KEY_REVIEWS = "shop_reviews";

// Default initial 4 merchandise products
export const INITIAL_SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "stand-acrylic",
    name: "Acrylic Table Stand",
    description:
      "Clear premium acrylic stand holding your QR card at table height. Wipes clean, stands sturdy, looks elegant on any dining table.",
    price: 499,
    originalPrice: 799,
    badge: "MOST POPULAR",
    image: "/assets/shop-stand.png",
    inStock: true,
    rating: 4.9,
    reviewsCount: 38,
    features: [
      "High-grade crystal clear 3mm acrylic",
      "UV & water resistant laser printed insert",
      "T-shape stable table-top base",
      "Easy wipe-clean daily sanitization",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "poster-a3",
    name: "Wall Poster (A3 Matte)",
    description:
      "Matte-finish A3 poster printed with your QR code, logo and short tagline. Perfect for entryways, counter, or pickup counters.",
    price: 349,
    originalPrice: 499,
    badge: "HIGH VISIBILITY",
    image: "/assets/shop-poster.png",
    inStock: true,
    rating: 4.8,
    reviewsCount: 24,
    features: [
      "300 GSM heavy-duty non-tearable matte paper",
      "Vibrant anti-glare fade-proof ink",
      "Custom brand logo & restaurant name",
      "Dual-sided mounting foam tape included",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "stickers-pack",
    name: "QR Sticker Pack (12 pcs)",
    description:
      "Weather-proof vinyl stickers for tables, glass windows, cash registers, and takeout packaging.",
    price: 249,
    originalPrice: 399,
    badge: "PACK OF 12",
    image: "/assets/shop-sticker.png",
    inStock: true,
    rating: 5.0,
    reviewsCount: 52,
    features: [
      "100% waterproof vinyl with gloss lamination",
      "Strong scratch-proof adhesive (leaves no residue)",
      "12 individual die-cut stickers per pack",
      "Pre-tested camera scan precision",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tent-wooden",
    name: "Folded Wooden Table Tent",
    description:
      "Double-sided premium tent card featuring your restaurant branding on one side and a scannable QR code on the other.",
    price: 399,
    originalPrice: 599,
    badge: "ECO-FRIENDLY",
    image: "/assets/shop-stand.png",
    inStock: true,
    rating: 4.9,
    reviewsCount: 19,
    features: [
      "Sustainable engineered wood core",
      "Dual-sided scannable finish",
      "Rustic cafe & fine-dine aesthetic",
      "Compact space-saving footprint",
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Initial seed reviews so products have authentic initial social proof
const INITIAL_SHOP_REVIEWS: ShopReview[] = [
  {
    id: "rev-1",
    productId: "stand-acrylic",
    userId: "usr-demo-1",
    userName: "Chef Sanjeev (Spice Junction)",
    rating: 5,
    title: "Super clean and sturdy!",
    comment:
      "Received all 10 acrylic stands within 3 days. Beautiful print quality and customers scan without issues from their seats.",
    verifiedPurchase: true,
    createdAt: "2026-02-10T11:20:00.000Z",
  },
  {
    id: "rev-2",
    productId: "stickers-pack",
    userId: "usr-demo-2",
    userName: "Rohit Verma (Cafe Bloom)",
    rating: 5,
    title: "100% waterproof indeed",
    comment:
      "We wipe our outdoor tables with sanitizer 10 times a day and the stickers still look brand new. COD delivery was seamless.",
    verifiedPurchase: true,
    createdAt: "2026-02-14T15:45:00.000Z",
  },
];

// Memory caches with TTL for sub-millisecond responses
let cachedProducts: ShopProduct[] | null = null;
let cachedOrders: ShopOrder[] | null = null;
let cachedReviews: ShopReview[] | null = null;
let cacheTimeProducts = 0;
let cacheTimeOrders = 0;
let cacheTimeReviews = 0;
const CACHE_TTL_MS = 2500; // 2.5 seconds cache

// -----------------------------------------------------------------------------
// PRODUCTS
// -----------------------------------------------------------------------------

export async function getShopProducts(): Promise<ShopProduct[]> {
  const now = Date.now();
  if (cachedProducts && now - cacheTimeProducts < CACHE_TTL_MS) {
    return cachedProducts;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY_PRODUCTS },
    });

    if (!row || !Array.isArray(row.value) || row.value.length === 0) {
      // Seed initial products
      await prisma.platformSetting.upsert({
        where: { key: SETTING_KEY_PRODUCTS },
        create: {
          key: SETTING_KEY_PRODUCTS,
          value: INITIAL_SHOP_PRODUCTS as any,
        },
        update: {
          value: INITIAL_SHOP_PRODUCTS as any,
        },
      });
      cachedProducts = INITIAL_SHOP_PRODUCTS;
      cacheTimeProducts = now;
      return INITIAL_SHOP_PRODUCTS;
    }

    const products = row.value as unknown as ShopProduct[];
    cachedProducts = products;
    cacheTimeProducts = now;
    return products;
  } catch (err) {
    console.error("[getShopProducts Error]", err);
    return cachedProducts || INITIAL_SHOP_PRODUCTS;
  }
}

export async function saveShopProduct(
  productData: Partial<ShopProduct> & { name: string; price: number }
): Promise<ShopProduct> {
  const products = await getShopProducts();
  const now = new Date().toISOString();

  let target: ShopProduct;

  if (productData.id) {
    const existingIndex = products.findIndex((p) => p.id === productData.id);
    if (existingIndex >= 0 && products[existingIndex]) {
      const prev = products[existingIndex]!;
      target = {
        ...prev,
        id: productData.id,
        name: productData.name ?? prev.name,
        description: productData.description ?? prev.description,
        price: Number(productData.price),
        originalPrice:
          productData.originalPrice !== undefined
            ? productData.originalPrice ? Number(productData.originalPrice) : null
            : prev.originalPrice,
        badge: productData.badge !== undefined ? productData.badge : prev.badge,
        image: productData.image ?? prev.image,
        inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : prev.inStock,
        updatedAt: now,
      };
      products[existingIndex] = target;
    } else {
      target = {
        id: productData.id,
        name: productData.name,
        description: productData.description || "",
        price: Number(productData.price),
        originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
        badge: productData.badge || "",
        image: productData.image || "/assets/shop-stand.png",
        inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true,
        rating: 5.0,
        reviewsCount: 0,
        features: productData.features || [],
        createdAt: now,
        updatedAt: now,
      };
      products.push(target);
    }
  } else {
    target = {
      id: "prod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      name: productData.name,
      description: productData.description || "",
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      badge: productData.badge || "",
      image: productData.image || "/assets/shop-stand.png",
      inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true,
      rating: 5.0,
      reviewsCount: 0,
      features: productData.features || [],
      createdAt: now,
      updatedAt: now,
    };
    products.push(target);
  }

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PRODUCTS },
    create: {
      key: SETTING_KEY_PRODUCTS,
      value: products as any,
    },
    update: {
      value: products as any,
    },
  });

  cachedProducts = products;
  cacheTimeProducts = Date.now();
  return target;
}

export async function deleteShopProduct(id: string): Promise<boolean> {
  const products = await getShopProducts();
  const filtered = products.filter((p) => p.id !== id);

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PRODUCTS },
    create: {
      key: SETTING_KEY_PRODUCTS,
      value: filtered as any,
    },
    update: {
      value: filtered as any,
    },
  });

  cachedProducts = filtered;
  cacheTimeProducts = Date.now();
  return true;
}

// -----------------------------------------------------------------------------
// ORDERS
// -----------------------------------------------------------------------------

export async function getShopOrders(userId?: string): Promise<ShopOrder[]> {
  const now = Date.now();
  if (!userId && cachedOrders && now - cacheTimeOrders < CACHE_TTL_MS) {
    return cachedOrders;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY_ORDERS },
    });

    if (!row || !Array.isArray(row.value)) {
      return [];
    }

    const orders = row.value as unknown as ShopOrder[];
    orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!userId) {
      cachedOrders = orders;
      cacheTimeOrders = now;
      return orders;
    }

    return orders.filter((o) => o.userId === userId);
  } catch (err) {
    console.error("[getShopOrders Error]", err);
    return [];
  }
}

export async function getShopOrderByIdOrNumber(
  identifier: string
): Promise<ShopOrder | null> {
  const clean = identifier.trim().toUpperCase();
  const allOrders = await getShopOrders();
  return (
    allOrders.find(
      (o) =>
        o.id.toUpperCase() === clean ||
        o.orderNumber.toUpperCase() === clean ||
        o.orderNumber.toUpperCase() === `MNL-${clean}` ||
        o.orderNumber.toUpperCase() === `SHOP-${clean}`
    ) || null
  );
}

export interface CreateShopOrderInput {
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | undefined;
  shippingAddress: ShopShippingAddress;
  items: Array<{ productId: string; quantity: number }>;
  paymentMode?: "COD" | "ONLINE" | undefined;
  notes?: string | undefined;
}

export async function createShopOrder(
  input: CreateShopOrderInput
): Promise<{ success: boolean; order?: ShopOrder; error?: string }> {
  if (!input.userId) {
    return { success: false, error: "Authentication required to place merchandise order." };
  }
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Cart is empty. Add products before placing order." };
  }
  if (!input.customerName?.trim() || !input.customerPhone?.trim()) {
    return { success: false, error: "Please provide your full name and phone number." };
  }
  if (
    !input.shippingAddress?.street?.trim() ||
    !input.shippingAddress?.city?.trim() ||
    !input.shippingAddress?.state?.trim() ||
    !input.shippingAddress?.pincode?.trim()
  ) {
    return { success: false, error: "Complete delivery address with PIN code is required." };
  }

  const products = await getShopProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems: ShopOrderItem[] = [];
  let subtotal = 0;

  for (const item of input.items) {
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    const prod = productMap.get(item.productId);
    if (!prod) {
      return { success: false, error: `Product not found: ${item.productId}` };
    }
    if (!prod.inStock) {
      return { success: false, error: `Product "${prod.name}" is currently out of stock.` };
    }

    const itemTotal = prod.price * qty;
    subtotal += itemTotal;
    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      price: prod.price,
      quantity: qty,
      image: prod.image,
      total: itemTotal,
    });
  }

  // Flat ₹80 Cash on Delivery / Express Courier charge as specified
  const deliveryFee = 80;
  const grandTotal = subtotal + deliveryFee;

  const now = new Date().toISOString();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `MNL-SHOP-${randomSuffix}`;

  const newOrder: ShopOrder = {
    id: `shop-ord-${Date.now()}-${randomSuffix}`,
    orderNumber,
    userId: input.userId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail?.trim() || undefined,
    shippingAddress: {
      fullName: input.shippingAddress.fullName || input.customerName.trim(),
      phone: input.shippingAddress.phone || input.customerPhone.trim(),
      street: input.shippingAddress.street.trim(),
      city: input.shippingAddress.city.trim(),
      state: input.shippingAddress.state.trim(),
      pincode: input.shippingAddress.pincode.trim(),
      landmark: input.shippingAddress.landmark?.trim() || undefined,
    },
    items: orderItems,
    subtotal,
    deliveryFee,
    grandTotal,
    paymentMode: input.paymentMode || "COD",
    status: "PLACED",
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const allOrders = await getShopOrders();
  allOrders.unshift(newOrder);

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_ORDERS },
    create: {
      key: SETTING_KEY_ORDERS,
      value: allOrders as any,
    },
    update: {
      value: allOrders as any,
    },
  });

  cachedOrders = allOrders;
  cacheTimeOrders = Date.now();

  return { success: true, order: newOrder };
}

export async function updateShopOrderStatus(
  orderId: string,
  status: ShopOrderStatus,
  courierPartner?: string,
  trackingNumber?: string
): Promise<{ success: boolean; order?: ShopOrder; error?: string }> {
  const allOrders = await getShopOrders();
  const orderIndex = allOrders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);

  if (orderIndex === -1) {
    return { success: false, error: "Order not found" };
  }

  const existing = allOrders[orderIndex];
  if (!existing) {
    return { success: false, error: "Order not found" };
  }
  const now = new Date().toISOString();

  const updated: ShopOrder = {
    ...existing,
    status,
    updatedAt: now,
    courierPartner: courierPartner !== undefined ? courierPartner : existing.courierPartner,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : existing.trackingNumber,
    deliveredAt:
      status === "DELIVERED"
        ? existing.deliveredAt || now
        : undefined,
  };

  allOrders[orderIndex] = updated;

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_ORDERS },
    create: {
      key: SETTING_KEY_ORDERS,
      value: allOrders as any,
    },
    update: {
      value: allOrders as any,
    },
  });

  cachedOrders = allOrders;
  cacheTimeOrders = Date.now();

  return { success: true, order: updated };
}

// -----------------------------------------------------------------------------
// REVIEWS
// -----------------------------------------------------------------------------

export async function getShopReviews(productId?: string): Promise<ShopReview[]> {
  const now = Date.now();
  if (!productId && cachedReviews && now - cacheTimeReviews < CACHE_TTL_MS) {
    return cachedReviews;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY_REVIEWS },
    });

    if (!row || !Array.isArray(row.value) || row.value.length === 0) {
      await prisma.platformSetting.upsert({
        where: { key: SETTING_KEY_REVIEWS },
        create: {
          key: SETTING_KEY_REVIEWS,
          value: INITIAL_SHOP_REVIEWS as any,
        },
        update: {
          value: INITIAL_SHOP_REVIEWS as any,
        },
      });
      cachedReviews = INITIAL_SHOP_REVIEWS;
      cacheTimeReviews = now;
      return productId
        ? INITIAL_SHOP_REVIEWS.filter((r) => r.productId === productId)
        : INITIAL_SHOP_REVIEWS;
    }

    const reviews = row.value as unknown as ShopReview[];
    reviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!productId) {
      cachedReviews = reviews;
      cacheTimeReviews = now;
      return reviews;
    }

    return reviews.filter((r) => r.productId === productId);
  } catch (err) {
    console.error("[getShopReviews Error]", err);
    return [];
  }
}

export interface CreateShopReviewInput {
  productId: string;
  orderId?: string | undefined;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  title?: string | undefined;
  comment: string;
}

export async function createShopReview(
  input: CreateShopReviewInput
): Promise<{ success: boolean; review?: ShopReview; error?: string }> {
  if (!input.userId) {
    return { success: false, error: "Please log in to leave a review." };
  }
  const rating = Math.min(5, Math.max(1, Math.round(input.rating || 5)));
  if (!input.comment?.trim()) {
    return { success: false, error: "Review comment cannot be empty." };
  }

  // Check if user has an order with this product
  const allOrders = await getShopOrders(input.userId);
  const hasPurchased = allOrders.some(
    (o) =>
      o.items.some((it) => it.productId === input.productId) &&
      (o.status === "DELIVERED" || o.status === "SHIPPED" || o.status === "PLACED" || o.status === "PROCESSING")
  );

  const newReview: ShopReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: input.productId,
    orderId: input.orderId,
    userId: input.userId,
    userName: input.userName.trim() || "Verified Buyer",
    rating,
    title: input.title?.trim() || undefined,
    comment: input.comment.trim(),
    verifiedPurchase: hasPurchased,
    createdAt: new Date().toISOString(),
  };

  const reviews = await getShopReviews();
  reviews.unshift(newReview);

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_REVIEWS },
    create: {
      key: SETTING_KEY_REVIEWS,
      value: reviews as any,
    },
    update: {
      value: reviews as any,
    },
  });

  cachedReviews = reviews;
  cacheTimeReviews = Date.now();

  // Recalculate average rating & review count for the product
  const productReviews = reviews.filter((r) => r.productId === input.productId);
  const totalScore = productReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Number((totalScore / productReviews.length).toFixed(1));

  const products = await getShopProducts();
  const prodIndex = products.findIndex((p) => p.id === input.productId);
  if (prodIndex >= 0 && products[prodIndex]) {
    products[prodIndex]!.rating = avgRating;
    products[prodIndex]!.reviewsCount = productReviews.length;

    await prisma.platformSetting.upsert({
      where: { key: SETTING_KEY_PRODUCTS },
      create: {
        key: SETTING_KEY_PRODUCTS,
        value: products as any,
      },
      update: {
        value: products as any,
      },
    });
    cachedProducts = products;
    cacheTimeProducts = Date.now();
  }

  return { success: true, review: newReview };
}

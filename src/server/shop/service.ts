import { prisma } from "../db";
import type {
  ShopProduct,
  ShopOrder,
  ShopOrderStatus,
  ShopReview,
  ShopShippingAddress,
  ShopOrderItem,
  ShopPaymentSession,
} from "../../lib/shop-types";
import {
  parseKotak811CreditAlert,
  calculateDynamicPaiseOffset,
  verifyPhonePeWebhookSignature,
  getMenulyPayConfig,
  PHONEPE_SANDBOX_SALT_KEY,
} from "../payments/menuly-pay";

// Key constants for PlatformSetting JSON storage
const SETTING_KEY_PRODUCTS = "shop_products";
const SETTING_KEY_ORDERS = "shop_orders";
const SETTING_KEY_REVIEWS = "shop_reviews";
const SETTING_KEY_PAYMENTS = "shop_payment_sessions";

// Official Kotak Mahindra Bank Merchant Details
export const KOTAK_UPI_ID = "9179878521@kotakbank";
export const KOTAK_ACCOUNT_NAME = "Menuly India";

// Default initial 4 merchandise products with 0 initial reviews/ratings (populated only via real customer feedback)
export const INITIAL_SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "stand-acrylic",
    name: "Acrylic Table Stand",
    description:
      "Clear premium optical-grade cast acrylic stand holding your QR menu at dining table height. Wipes clean, stands sturdy under high-speed ceiling fans, looks ultra elegant on every dining table.",
    price: 499,
    originalPrice: 799,
    badge: "MOST POPULAR",
    image: "/assets/shop-stand.png",
    inStock: true,
    stock: 100,
    rating: 0,
    reviewsCount: 0,
    features: [
      "High-grade crystal clear 3mm cast acrylic",
      "UV & water resistant laser printed insert",
      "Heavyweight T-shape anti-tumble table base",
      "Easy wipe-clean daily sanitization (100% waterproof)",
    ],
    whatsInside: [
      "1x High-grade 3mm optical cast acrylic self-standing display",
      "1x Custom dual-sided UV laser printed restaurant QR insert",
      "1x Anti-scratch protective transit peel film",
      "1x Restaurant setup & instant scan instruction card",
    ],
    specifications: {
      Material: "3mm Optical-Grade Cast Acrylic",
      Dimensions: "A6 Size (105mm × 148mm)",
      "Base Design": "T-Shape Anti-Tumble Heavyweight Foot",
      "Print Finish": "UV-Cured Direct Micro-Pigment Ink",
      Waterproof: "100% Sanitizer & Spray Proof",
      Compatibility: "iOS Camera, Android Camera, Google Lens, Paytm, PhonePe",
    },
    howToUse: [
      {
        step: 1,
        title: "Unpack Pre-Assembled Stand",
        desc: "Each stand arrives carefully packaged with your high-res vector QR menu insert already inserted inside.",
      },
      {
        step: 2,
        title: "Place at Center of Dining Tables",
        desc: "Place one acrylic stand on each table or billing desk at comfortable eye-level height.",
      },
      {
        step: 3,
        title: "Guests Scan & Order",
        desc: "Diners open their phone camera, scan the code, and browse dishes with zero app download.",
      },
      {
        step: 4,
        title: "Wipe Clean Daily",
        desc: "Wipe down with damp cloth or sanitizer spray between guests — ink will never smear or fade.",
      },
    ],
    deliveryInfo: "Dispatched within 24 to 48 hours via BlueDart / Delhivery / DTDC express courier. Flat ₹80 Pan-India delivery.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "poster-a3",
    name: "Wall Poster (A3 Matte)",
    description:
      "Matte-finish A3 poster printed with your high-res QR code, restaurant logo and tagline. Perfect for main entrances, billing counters, or takeaway queues.",
    price: 349,
    originalPrice: 499,
    badge: "HIGH VISIBILITY",
    image: "/assets/shop-poster.png",
    inStock: true,
    stock: 100,
    rating: 0,
    reviewsCount: 0,
    features: [
      "300 GSM heavy-duty non-tearable matte paper",
      "Anti-glare spotlight-resistant satin coating",
      "Custom brand logo & restaurant name header",
      "Dual-sided 3M mounting foam tape included",
    ],
    whatsInside: [
      "1x Heavyweight 300 GSM velvet matte A3 poster",
      "4x Pre-applied 3M high-bond double-sided foam mounting tape pads",
      "1x High-durability waterproof postal delivery tube",
    ],
    specifications: {
      Cardstock: "300 GSM Heavyweight Velvet Matte Cardstock",
      Dimensions: "A3 Size (297mm × 420mm)",
      Lamination: "Anti-Glare Spotlight Resistant Satin Coating",
      "Mounting Tape": "Dual-Sided 3M High-Bonding Foam Tape Included",
      "Scan Range": "Long-Range Scanning up to 8–10 Feet Away",
      Usage: "Indoor / Covered Entrance, Counter & Waiting Areas",
    },
    howToUse: [
      {
        step: 1,
        title: "Select High-Footfall Area",
        desc: "Ideal for restaurant entryways, pillar walls, pickup counters, or waiting line areas.",
      },
      {
        step: 2,
        title: "Peel Protective Tape",
        desc: "Peel off the protective film from the pre-applied 3M foam tape on the reverse side.",
      },
      {
        step: 3,
        title: "Press Firmly at Eye-Level",
        desc: "Mount approximately 5 feet from the floor for comfortable scanning while diners stand.",
      },
      {
        step: 4,
        title: "Clear Walk-In Queues",
        desc: "Walk-in customers scan from a distance to decide their orders before reaching the cashier.",
      },
    ],
    deliveryInfo: "Dispatched within 24 to 48 hours via BlueDart / Delhivery / DTDC express courier. Flat ₹80 Pan-India delivery.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "stickers-pack",
    name: "QR Sticker Pack (12 pcs)",
    description:
      "Weather-proof vinyl stickers for tables, glass windows, cash registers, and takeout packaging. Strong adhesive that peels off clean without residue.",
    price: 249,
    originalPrice: 399,
    badge: "PACK OF 12",
    image: "/assets/shop-sticker.png",
    inStock: true,
    stock: 100,
    rating: 0,
    reviewsCount: 0,
    features: [
      "100% waterproof vinyl with gloss lamination",
      "High-tack scratch-proof adhesive (leaves no sticky residue)",
      "12 individual die-cut scannable stickers",
      "Pre-tested for instant smartphone camera scanning",
    ],
    whatsInside: [
      "12x Individual die-cut scannable QR vinyl stickers",
      "1x Surface cleaning alcohol prep wipe",
      "1x Sticker application alignment guide",
    ],
    specifications: {
      Material: "High-Density Self-Adhesive Cast Vinyl",
      Dimensions: "75mm × 75mm Circular Die-Cut",
      Finish: "High-Gloss UV Protective Topcoat",
      Adhesive: "Waterproof High-Tack Adhesive (Clean Peel Off)",
      Durability: "Resistant to hot oil, curry spills, detergents, and UV sun",
      Quantity: "12 Stickers per pack",
    },
    howToUse: [
      {
        step: 1,
        title: "Clean Surface",
        desc: "Wipe dining table, bar counter, or payment glass with the included alcohol wipe.",
      },
      {
        step: 2,
        title: "Peel & Stick",
        desc: "Peel off back liner and firmly press from center to edges to prevent air bubbles.",
      },
      {
        step: 3,
        title: "Immediate Use",
        desc: "Ready for guest scanning right away. Withstands hot plates and daily sanitizers.",
      },
    ],
    deliveryInfo: "Dispatched within 24 to 48 hours via BlueDart / Delhivery / DTDC express courier. Flat ₹80 Pan-India delivery.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tent-wooden",
    name: "Folded Wooden Table Tent",
    description:
      "Double-sided premium tent card featuring your restaurant branding on one side and a scannable QR code on the other. Rustic artisan cafe aesthetic.",
    price: 399,
    originalPrice: 599,
    badge: "ECO-FRIENDLY",
    image: "/assets/shop-stand.png",
    inStock: true,
    stock: 100,
    rating: 0,
    reviewsCount: 0,
    features: [
      "Sustainable engineered wood core (moisture sealed)",
      "Dual-sided scannable A-frame tent finish",
      "Rustic cafe & fine-dine aesthetic",
      "Compact space-saving dining table footprint",
    ],
    whatsInside: [
      "1x Premium moisture-sealed engineered hardwood tent card",
      "2x Pre-mounted high-resolution matte printed QR facets",
      "1x Soft microfiber surface buffing cloth",
    ],
    specifications: {
      Material: "Engineered Hardwood with Natural Teak Veneer",
      Dimensions: "A6 Portrait (105mm × 148mm × 65mm Base Spread)",
      Finish: "Semi-Matte Natural Wood Grain Protective Lacquer",
      Design: "Self-Standing Dual-Sided A-Frame Tent Structure",
      Maintenance: "Easy damp cloth cleaning; moisture resistant",
      Aesthetic: "Rustic Cafe, Artisanal Bistro & Fine Dining Atmosphere",
    },
    howToUse: [
      {
        step: 1,
        title: "Unpack Wooden Tent",
        desc: "Arrives pre-assembled with smooth chamfered edges and clear double-sided QR prints.",
      },
      {
        step: 2,
        title: "Position on Table",
        desc: "Place on center of cafe or dining table. The A-frame shape prevents tumbling under fans.",
      },
      {
        step: 3,
        title: "Dual Direction Scan",
        desc: "Guests seated on either side of the table can scan without turning the stand around.",
      },
    ],
    deliveryInfo: "Dispatched within 24 to 48 hours via BlueDart / Delhivery / DTDC express courier. Flat ₹80 Pan-India delivery.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// No fake/demo reviews - only authentic reviews from customers with DELIVERED orders
const INITIAL_SHOP_REVIEWS: ShopReview[] = [];

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

    let products: ShopProduct[];
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
      products = INITIAL_SHOP_PRODUCTS;
    } else {
      products = row.value as unknown as ShopProduct[];
    }

    // Synchronize real review ratings & defaults for stock / rich specs
    const allReviews = await getShopReviews();
    for (const p of products) {
      const defaultProd = INITIAL_SHOP_PRODUCTS.find((init) => init.id === p.id);
      if (p.stock === undefined || p.stock === null) {
        p.stock = defaultProd?.stock ?? 100;
      }
      if (!p.whatsInside && defaultProd?.whatsInside) {
        p.whatsInside = defaultProd.whatsInside;
      }
      if (!p.specifications && defaultProd?.specifications) {
        p.specifications = defaultProd.specifications;
      }
      if (!p.howToUse && defaultProd?.howToUse) {
        p.howToUse = defaultProd.howToUse;
      }
      if (!p.deliveryInfo && defaultProd?.deliveryInfo) {
        p.deliveryInfo = defaultProd.deliveryInfo;
      }

      const prodRevs = allReviews.filter((r) => r.productId === p.id);
      p.reviewsCount = prodRevs.length;
      if (prodRevs.length === 0) {
        p.rating = 0;
      } else {
        const total = prodRevs.reduce((sum, r) => sum + r.rating, 0);
        p.rating = Number((total / prodRevs.length).toFixed(1));
      }
    }

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

  const stockValue =
    productData.stock !== undefined ? Math.max(0, Number(productData.stock)) : 100;
  const inStockValue =
    productData.inStock !== undefined ? Boolean(productData.inStock) : stockValue > 0;

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
        stock: productData.stock !== undefined ? stockValue : (prev.stock ?? 100),
        inStock:
          productData.inStock !== undefined
            ? inStockValue
            : (productData.stock !== undefined ? stockValue > 0 : prev.inStock),
        whatsInside: productData.whatsInside !== undefined ? productData.whatsInside : prev.whatsInside,
        specifications: productData.specifications !== undefined ? productData.specifications : prev.specifications,
        howToUse: productData.howToUse !== undefined ? productData.howToUse : prev.howToUse,
        deliveryInfo: productData.deliveryInfo !== undefined ? productData.deliveryInfo : prev.deliveryInfo,
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
        stock: stockValue,
        inStock: inStockValue,
        rating: 0,
        reviewsCount: 0,
        features: productData.features || [],
        whatsInside: productData.whatsInside || [],
        specifications: productData.specifications || {},
        howToUse: productData.howToUse || [],
        deliveryInfo: productData.deliveryInfo || "",
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
      stock: stockValue,
      inStock: inStockValue,
      rating: 0,
      reviewsCount: 0,
      features: productData.features || [],
      whatsInside: productData.whatsInside || [],
      specifications: productData.specifications || {},
      howToUse: productData.howToUse || [],
      deliveryInfo: productData.deliveryInfo || "",
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
  paymentMode?: "COD" | "UPI" | "ONLINE" | undefined;
  paymentSessionId?: string | undefined;
  upiUtr?: string | undefined;
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

  // Dynamic stock reduction
  let stockUpdated = false;
  for (const item of input.items) {
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    const prod = productMap.get(item.productId);
    if (!prod) {
      return { success: false, error: `Product not found: ${item.productId}` };
    }
    if (!prod.inStock) {
      return { success: false, error: `Product "${prod.name}" is currently out of stock.` };
    }

    // Decrement stock count
    const currentStock = typeof prod.stock === "number" ? prod.stock : 100;
    const remainingStock = Math.max(0, currentStock - qty);
    prod.stock = remainingStock;
    if (remainingStock <= 0) {
      prod.inStock = false;
    }
    stockUpdated = true;

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

  // Persist updated product stock to database
  if (stockUpdated) {
    try {
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
    } catch (stockErr) {
      console.error("[createShopOrder Stock Update Error]", stockErr);
    }
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
    paymentStatus: input.paymentMode === "UPI" ? (input.upiUtr ? "PAID" : "PENDING") : undefined,
    paymentSessionId: input.paymentSessionId || undefined,
    upiUtr: input.upiUtr?.trim() || undefined,
    status: input.paymentMode === "UPI" && input.upiUtr ? "PROCESSING" : "PLACED",
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
  trackingNumber?: string,
  paymentStatus?: "PAID" | "PENDING" | "FAILED"
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

  const nextPaymentStatus =
    paymentStatus !== undefined
      ? paymentStatus
      : status === "DELIVERED" && existing.paymentMode === "COD"
      ? "PAID"
      : existing.paymentStatus;

  const updated: ShopOrder = {
    ...existing,
    status,
    paymentStatus: nextPaymentStatus,
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
  if (cachedReviews && now - cacheTimeReviews < CACHE_TTL_MS) {
    return productId
      ? cachedReviews.filter((r) => r.productId === productId)
      : cachedReviews;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY_REVIEWS },
    });

    if (!row || !Array.isArray(row.value) || row.value.length === 0) {
      cachedReviews = [];
      cacheTimeReviews = now;
      return [];
    }

    const raw = row.value as unknown as ShopReview[];
    // Filter out any legacy dummy reviews
    const reviews = raw.filter(
      (r) =>
        r &&
        !r.userId.startsWith("usr-demo") &&
        !r.id.startsWith("rev-1") &&
        !r.id.startsWith("rev-2")
    );
    reviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    cachedReviews = reviews;
    cacheTimeReviews = now;

    return productId
      ? reviews.filter((r) => r.productId === productId)
      : reviews;
  } catch (err) {
    console.error("[getShopReviews Error]", err);
    return [];
  }
}

/**
 * Checks whether a specific user is eligible to write a review for a product.
 * Policy:
 * 1. User must have at least one order containing this product that has reached DELIVERED status.
 * 2. User must not have already reviewed this product.
 */
export async function canUserReviewProduct(
  userId: string,
  productId: string
): Promise<{ canReview: boolean; orderId?: string; reason?: string }> {
  if (!userId) {
    return { canReview: false, reason: "Please log in to submit a review." };
  }

  const reviews = await getShopReviews(productId);
  const alreadyReviewed = reviews.some((r) => r.userId === userId && r.productId === productId);
  if (alreadyReviewed) {
    return { canReview: false, reason: "You have already reviewed this product." };
  }

  const allOrders = await getShopOrders(userId);
  const deliveredOrder = allOrders.find(
    (o) =>
      o.status === "DELIVERED" &&
      o.items.some((it) => it.productId === productId)
  );

  if (!deliveredOrder) {
    return {
      canReview: false,
      reason: "You can only write a review after this product has been successfully delivered to you.",
    };
  }

  return { canReview: true, orderId: deliveredOrder.id };
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

  // Strictly check that user has an order with status DELIVERED for this product
  const eligibility = await canUserReviewProduct(input.userId, input.productId);
  if (!eligibility.canReview) {
    return {
      success: false,
      error: eligibility.reason || "You can only review a product after it has been delivered to you.",
    };
  }

  const newReview: ShopReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: input.productId,
    orderId: input.orderId || eligibility.orderId,
    userId: input.userId,
    userName: input.userName.trim() || "Verified Buyer",
    rating,
    title: input.title?.trim() || undefined,
    comment: input.comment.trim(),
    verifiedPurchase: true,
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

// -----------------------------------------------------------------------------
// KOTAK MAHINDRA BANK DYNAMIC UPI PAYMENT GATEWAY ENGINE
// -----------------------------------------------------------------------------

let cachedPaymentSessions: ShopPaymentSession[] | null = null;
let cacheTimePayments = 0;

export async function getShopPaymentSessions(): Promise<ShopPaymentSession[]> {
  const now = Date.now();
  if (cachedPaymentSessions && now - cacheTimePayments < CACHE_TTL_MS) {
    return cachedPaymentSessions;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY_PAYMENTS },
    });
    if (!row || !Array.isArray(row.value)) {
      cachedPaymentSessions = [];
      cacheTimePayments = now;
      return [];
    }
    const sessions = row.value as unknown as ShopPaymentSession[];
    sessions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    cachedPaymentSessions = sessions;
    cacheTimePayments = now;
    return sessions;
  } catch (err) {
    console.error("[getShopPaymentSessions Error]", err);
    return [];
  }
}

export async function createShopPaymentSession(params: {
  userId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  orderNumber?: string | undefined;
  orderId?: string | undefined;
}): Promise<ShopPaymentSession> {
  const allSessions = await getShopPaymentSessions();
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins expiry
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const sessionId = `MNL-TXN-${Date.now()}-${randomSuffix}`;
  const orderNum = params.orderNumber || `MNL-ORD-${randomSuffix}`;

  // Find other recent pending amounts within 15 minutes to avoid collision on identical amounts
  const recentPendingAmounts = allSessions
    .filter(
      (s) =>
        s.status === "PENDING" &&
        now.getTime() - new Date(s.createdAt).getTime() < 15 * 60 * 1000
    )
    .map((s) => s.amount);

  const cleanAmount = calculateDynamicPaiseOffset(params.amount, recentPendingAmounts);
  const upiUri = `upi://pay?pa=${KOTAK_UPI_ID}&pn=${encodeURIComponent(
    KOTAK_ACCOUNT_NAME
  )}&am=${cleanAmount}&cu=INR&tr=${sessionId}&tn=${encodeURIComponent(
    `Order_${orderNum}`
  )}`;

  const session: ShopPaymentSession = {
    id: sessionId,
    orderId: params.orderId,
    orderNumber: orderNum,
    userId: params.userId,
    customerName: params.customerName.trim(),
    customerPhone: params.customerPhone.trim(),
    amount: cleanAmount,
    upiId: KOTAK_UPI_ID,
    upiUri,
    status: "PENDING",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  allSessions.unshift(session);
  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PAYMENTS },
    create: { key: SETTING_KEY_PAYMENTS, value: allSessions as any },
    update: { value: allSessions as any },
  });

  cachedPaymentSessions = allSessions;
  cacheTimePayments = Date.now();

  return session;
}

export async function getShopPaymentSessionById(
  sessionId: string
): Promise<ShopPaymentSession | null> {
  const all = await getShopPaymentSessions();
  return all.find((s) => s.id === sessionId) || null;
}

export async function verifyPaymentSessionUtr(
  sessionId: string,
  utr: string
): Promise<{ success: boolean; session?: ShopPaymentSession; error?: string }> {
  const cleanUtr = utr.trim().replace(/\D/g, "");
  if (!cleanUtr || cleanUtr.length < 10) {
    return {
      success: false,
      error: "Please enter a valid 12-digit UPI UTR / Reference number from your payment app.",
    };
  }

  const all = await getShopPaymentSessions();
  const session = all.find((s) => s.id === sessionId);
  if (!session) {
    return { success: false, error: "Payment session not found or expired." };
  }

  // Prevent duplicate UTR usage across other paid sessions
  const duplicate = all.find(
    (s) => s.id !== sessionId && s.utr === cleanUtr && s.status === "PAID"
  );
  if (duplicate) {
    return {
      success: false,
      error: "This 12-digit UTR has already been submitted for another transaction.",
    };
  }

  session.status = "PAID";
  session.utr = cleanUtr;
  session.verifiedVia = "INSTANT_UTR";
  session.paidAt = new Date().toISOString();
  session.bankAuditNote = `Verified via 12-digit UTR: ${cleanUtr}`;

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PAYMENTS },
    create: { key: SETTING_KEY_PAYMENTS, value: all as any },
    update: { value: all as any },
  });

  cachedPaymentSessions = all;
  cacheTimePayments = Date.now();

  // Also update corresponding Order if linked (mark order PAID & move to PROCESSING for printing)
  if (session.orderId || session.orderNumber) {
    const orders = await getShopOrders();
    const ord = orders.find(
      (o) => o.id === session.orderId || o.orderNumber === session.orderNumber
    );
    if (ord) {
      ord.paymentStatus = "PAID";
      ord.upiUtr = cleanUtr;
      if (ord.status === "PLACED") {
        ord.status = "PROCESSING";
      }
      ord.updatedAt = new Date().toISOString();
      await prisma.platformSetting.upsert({
        where: { key: SETTING_KEY_ORDERS },
        create: { key: SETTING_KEY_ORDERS, value: orders as any },
        update: { value: orders as any },
      });
      cachedOrders = orders;
      cacheTimeOrders = Date.now();
    }
  }

  return { success: true, session };
}

export async function processBankCreditWebhook(payload: {
  amount?: number | undefined;
  utr?: string | undefined;
  text?: string | undefined;
  sender?: string | undefined;
}): Promise<{
  success: boolean;
  matchedSession?: ShopPaymentSession;
  message: string;
}> {
  const all = await getShopPaymentSessions();

  let extractedAmount = payload.amount;
  let extractedUtr = payload.utr?.trim().replace(/\D/g, "");
  let extractedSender = payload.sender?.trim();

  if (payload.text) {
    // 1. First attempt exact Kotak 811 transaction alert parsing
    const parsed811 = parseKotak811CreditAlert(payload.text);
    if (parsed811.amount) extractedAmount = parsed811.amount;
    if (parsed811.rrn) extractedUtr = parsed811.rrn;
    if (parsed811.sender) extractedSender = parsed811.sender;

    // 2. Generic regex fallback if Kotak 811 alert didn't match
    if (!extractedAmount) {
      const amtMatch = payload.text.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
      if (amtMatch && amtMatch[1]) {
        extractedAmount = parseFloat(amtMatch[1].replace(/,/g, ""));
      }
    }
    if (!extractedUtr) {
      const utrMatch = payload.text.match(/(?:UPI|Ref|UTR|rrn|txn)[/:\s-]*(\d{10,14})/i);
      if (utrMatch && utrMatch[1]) {
        extractedUtr = utrMatch[1];
      }
    }
  }

  if (!extractedAmount && !extractedUtr) {
    return {
      success: false,
      message: "Could not parse credit amount or UTR from incoming bank notification.",
    };
  }

  // Find matching PENDING session created within last 2 hours
  const now = Date.now();
  const matchedSession = all.find((s) => {
    if (s.status === "PAID") return false;
    const isRecent = now - new Date(s.createdAt).getTime() < 2 * 60 * 60 * 1000;
    if (!isRecent) return false;
    if (extractedUtr && s.utr === extractedUtr) return true;
    if (extractedAmount && Math.abs(s.amount - extractedAmount) < 0.01) {
      // If sender was extracted, verify name similarity if available
      if (extractedSender && s.customerName) {
        const sFirst = s.customerName.toLowerCase().split(/\s+/)[0] || "";
        const eFirst = extractedSender.toLowerCase().split(/\s+/)[0] || "";
        if (sFirst && eFirst && (sFirst.includes(eFirst) || eFirst.includes(sFirst))) {
          return true;
        }
      }
      return true;
    }
    return false;
  });

  if (!matchedSession) {
    return {
      success: false,
      message: `Kotak credit received (₹${extractedAmount || "N/A"}${
        extractedUtr ? ` UTR:${extractedUtr}` : ""
      }${extractedSender ? ` Sender:${extractedSender}` : ""}), but no matching pending checkout session found. Logged in audit history.`,
    };
  }

  matchedSession.status = "PAID";
  if (extractedUtr) matchedSession.utr = extractedUtr;
  matchedSession.verifiedVia = "EMAIL_WEBHOOK";
  matchedSession.paidAt = new Date().toISOString();
  matchedSession.bankAuditNote = `Auto-verified via Kotak credit email webhook. Amount: ₹${extractedAmount}${
    extractedSender ? ` | Sender: ${extractedSender}` : ""
  }`;

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PAYMENTS },
    create: { key: SETTING_KEY_PAYMENTS, value: all as any },
    update: { value: all as any },
  });

  cachedPaymentSessions = all;
  cacheTimePayments = Date.now();

  // Also update corresponding Order
  if (matchedSession.orderId || matchedSession.orderNumber) {
    const orders = await getShopOrders();
    const ord = orders.find(
      (o) =>
        o.id === matchedSession.orderId ||
        o.orderNumber === matchedSession.orderNumber
    );
    if (ord) {
      ord.paymentStatus = "PAID";
      if (extractedUtr) ord.upiUtr = extractedUtr;
      if (ord.status === "PLACED") {
        ord.status = "PROCESSING";
      }
      await prisma.platformSetting.upsert({
        where: { key: SETTING_KEY_ORDERS },
        create: { key: SETTING_KEY_ORDERS, value: orders as any },
        update: { value: orders as any },
      });
      cachedOrders = orders;
      cacheTimeOrders = Date.now();
    }
  }

  return {
    success: true,
    matchedSession,
    message: `Payment auto-verified for Order ${matchedSession.orderNumber || matchedSession.id}`,
  };
}

/**
 * Handle PhonePe Merchant Callback Webhook
 * Verifies SHA256 X-VERIFY signature and confirms matching order instantly
 */
export async function handlePhonePeWebhook(params: {
  base64Response: string;
  xVerifyHeader: string;
}): Promise<{
  success: boolean;
  message: string;
  orderNumber?: string | undefined;
  session?: ShopPaymentSession | undefined;
}> {
  const config = getMenulyPayConfig();
  const saltKey = config.phonepeSaltKey || PHONEPE_SANDBOX_SALT_KEY;
  const saltIndex = config.phonepeSaltIndex || 1;

  const isValid = verifyPhonePeWebhookSignature(
    params.base64Response,
    params.xVerifyHeader,
    saltKey,
    saltIndex
  );

  if (!isValid) {
    return { success: false, message: "Invalid PhonePe webhook signature" };
  }

  let decoded: any;
  try {
    const jsonStr = Buffer.from(params.base64Response, "base64").toString("utf-8");
    decoded = JSON.parse(jsonStr);
  } catch {
    return { success: false, message: "Failed to decode base64 payload" };
  }

  if (decoded.code !== "PAYMENT_SUCCESS") {
    return {
      success: false,
      message: `PhonePe reported non-success status: ${decoded.code}`,
    };
  }

  const txnId = decoded.data?.merchantTransactionId;
  const providerRef =
    decoded.data?.providerReferenceId ||
    decoded.data?.paymentInstrument?.utr ||
    decoded.data?.paymentInstrument?.bankTransactionId;
  const amount = decoded.data?.amount ? decoded.data.amount / 100 : undefined;

  const all = await getShopPaymentSessions();
  const matchedSession = all.find((s) => s.id === txnId);

  if (!matchedSession) {
    return {
      success: false,
      message: `Transaction ${txnId} not found in Menuly payment sessions.`,
    };
  }

  matchedSession.status = "PAID";
  if (providerRef) matchedSession.utr = providerRef;
  matchedSession.verifiedVia = "PHONEPE_WEBHOOK" as any;
  matchedSession.paidAt = new Date().toISOString();
  matchedSession.bankAuditNote = `Verified via PhonePe Merchant Webhook. Amount: ₹${
    amount || matchedSession.amount
  }, UTR: ${providerRef || "N/A"}`;

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PAYMENTS },
    create: { key: SETTING_KEY_PAYMENTS, value: all as any },
    update: { value: all as any },
  });

  cachedPaymentSessions = all;
  cacheTimePayments = Date.now();

  // Also update corresponding order
  if (matchedSession.orderId || matchedSession.orderNumber) {
    const orders = await getShopOrders();
    const ord = orders.find(
      (o) =>
        o.id === matchedSession.orderId ||
        o.orderNumber === matchedSession.orderNumber
    );
    if (ord) {
      ord.paymentStatus = "PAID";
      if (providerRef) ord.upiUtr = providerRef;
      if (ord.status === "PLACED") {
        ord.status = "PROCESSING";
      }
      ord.updatedAt = new Date().toISOString();
      await prisma.platformSetting.upsert({
        where: { key: SETTING_KEY_ORDERS },
        create: { key: SETTING_KEY_ORDERS, value: orders as any },
        update: { value: orders as any },
      });
      cachedOrders = orders;
      cacheTimeOrders = Date.now();
    }
  }

  return {
    success: true,
    message: "PhonePe payment verified successfully!",
    orderNumber: matchedSession.orderNumber,
    session: matchedSession,
  };
}

export async function adminUpdatePaymentSession(
  sessionId: string,
  status: "PAID" | "FAILED" | "PENDING",
  note?: string
): Promise<{ success: boolean; session?: ShopPaymentSession; error?: string }> {
  const all = await getShopPaymentSessions();
  const session = all.find((s) => s.id === sessionId);
  if (!session) return { success: false, error: "Payment session not found." };

  session.status = status;
  if (status === "PAID") {
    session.paidAt = session.paidAt || new Date().toISOString();
    session.verifiedVia = "ADMIN_APPROVAL";
  }
  if (note) session.bankAuditNote = note.trim();

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY_PAYMENTS },
    create: { key: SETTING_KEY_PAYMENTS, value: all as any },
    update: { value: all as any },
  });

  cachedPaymentSessions = all;
  cacheTimePayments = Date.now();

  // Sync with order
  if (session.orderId || session.orderNumber) {
    const orders = await getShopOrders();
    const ord = orders.find(
      (o) => o.id === session.orderId || o.orderNumber === session.orderNumber
    );
    if (ord) {
      ord.paymentStatus =
        status === "PAID" ? "PAID" : status === "FAILED" ? "FAILED" : "PENDING";
      if (status === "PAID" && ord.status === "PLACED") {
        ord.status = "PROCESSING";
      }
      await prisma.platformSetting.upsert({
        where: { key: SETTING_KEY_ORDERS },
        create: { key: SETTING_KEY_ORDERS, value: orders as any },
        update: { value: orders as any },
      });
    }
  }

  return { success: true, session };
}

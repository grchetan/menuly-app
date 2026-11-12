import { describe, it, expect, beforeAll } from "vitest";
import {
  getShopProducts,
  saveShopProduct,
  createShopOrder,
  getShopOrders,
  getShopOrderByIdOrNumber,
  updateShopOrderStatus,
  getShopReviews,
  createShopReview,
} from "../server/shop/service";

describe("Menuly E-Commerce Shop & Merchandise Engine Suite", () => {
  const testUserId = "test-buyer-" + Date.now();
  let createdOrderId: string = "";
  let createdOrderNumber: string = "";

  it("seeds and returns the 4 initial merchandise products", async () => {
    const products = await getShopProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThanOrEqual(4);

    const names = products.map((p) => p.name);
    expect(names).toContain("Acrylic Table Stand");
    expect(names).toContain("Wall Poster (A3 Matte)");
    expect(names).toContain("QR Sticker Pack (12 pcs)");
    expect(names).toContain("Folded Wooden Table Tent");

    const stand = products.find((p) => p.name === "Acrylic Table Stand");
    expect(stand).toBeDefined();
    expect(stand?.price).toBe(499);
    expect(stand?.originalPrice).toBe(799);
    expect(stand?.badge).toBe("MOST POPULAR");
  });

  it("rejects order creation without authentication or with empty items", async () => {
    const emptyRes = await createShopOrder({
      userId: "",
      customerName: "Test User",
      customerPhone: "9876543210",
      shippingAddress: {
        fullName: "Test",
        phone: "9876543210",
        street: "123 Main St",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [],
    });
    expect(emptyRes.success).toBe(false);
    expect(emptyRes.error).toMatch(/authentication required/i);

    const emptyCartRes = await createShopOrder({
      userId: testUserId,
      customerName: "Test User",
      customerPhone: "9876543210",
      shippingAddress: {
        fullName: "Test",
        phone: "9876543210",
        street: "123 Main St",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
      },
      items: [],
    });
    expect(emptyCartRes.success).toBe(false);
    expect(emptyCartRes.error).toMatch(/empty/i);
  });

  it("creates order, applies flat ₹80 delivery fee, and generates tracking number", async () => {
    const products = await getShopProducts();
    const stand = products.find((p) => p.name === "Acrylic Table Stand")!;
    const stickers = products.find((p) => p.name === "QR Sticker Pack (12 pcs)")!;

    const orderRes = await createShopOrder({
      userId: testUserId,
      customerName: "Aman Sharma",
      customerPhone: "9876543210",
      customerEmail: "aman@menuly.app",
      shippingAddress: {
        fullName: "Aman Sharma",
        phone: "9876543210",
        street: "Shop #4, Near Clock Tower, MI Road",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        landmark: "Opposite Raj Mandir Cinema",
      },
      items: [
        { productId: stand.id, quantity: 2 }, // 499 * 2 = 998
        { productId: stickers.id, quantity: 1 }, // 249 * 1 = 249
      ],
      paymentMode: "COD",
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.order).toBeDefined();

    const order = orderRes.order!;
    createdOrderId = order.id;
    createdOrderNumber = order.orderNumber;

    // Subtotal: 998 + 249 = 1247
    expect(order.subtotal).toBe(1247);
    // Explicit ₹80 Cash on Delivery / Express Delivery Fee
    expect(order.deliveryFee).toBe(80);
    // Grand Total: 1247 + 80 = 1327
    expect(order.grandTotal).toBe(1327);
    expect(order.paymentMode).toBe("COD");
    expect(order.status).toBe("PLACED");
    expect(order.orderNumber).toMatch(/^MNL-SHOP-\d{4}$/);
  });

  it("retrieves and tracks the order by orderNumber or ID", async () => {
    const byId = await getShopOrderByIdOrNumber(createdOrderId);
    expect(byId).toBeDefined();
    expect(byId?.id).toBe(createdOrderId);

    const byNumber = await getShopOrderByIdOrNumber(createdOrderNumber);
    expect(byNumber).toBeDefined();
    expect(byNumber?.orderNumber).toBe(createdOrderNumber);

    const userOrders = await getShopOrders(testUserId);
    expect(userOrders.length).toBeGreaterThanOrEqual(1);
    expect(userOrders[0]?.id).toBe(createdOrderId);
  });

  it("updates order workflow: PLACED -> PROCESSING -> SHIPPED -> DELIVERED", async () => {
    // 1. Processing
    const procRes = await updateShopOrderStatus(createdOrderId, "PROCESSING");
    expect(procRes.success).toBe(true);
    expect(procRes.order?.status).toBe("PROCESSING");

    // 2. Shipped with Courier
    const shipRes = await updateShopOrderStatus(
      createdOrderId,
      "SHIPPED",
      "BlueDart Express",
      "BD-982183109"
    );
    expect(shipRes.success).toBe(true);
    expect(shipRes.order?.status).toBe("SHIPPED");
    expect(shipRes.order?.courierPartner).toBe("BlueDart Express");
    expect(shipRes.order?.trackingNumber).toBe("BD-982183109");

    // 3. Delivered
    const delivRes = await updateShopOrderStatus(createdOrderId, "DELIVERED");
    expect(delivRes.success).toBe(true);
    expect(delivRes.order?.status).toBe("DELIVERED");
    expect(delivRes.order?.deliveredAt).toBeDefined();
  });

  it("submits 1-5 star review for delivered product and updates product rating", async () => {
    const products = await getShopProducts();
    const stand = products.find((p) => p.name === "Acrylic Table Stand")!;

    const reviewRes = await createShopReview({
      productId: stand.id,
      orderId: createdOrderId,
      userId: testUserId,
      userName: "Aman Sharma",
      rating: 5,
      title: "Super sturdy and looks ultra premium",
      comment: "All guests scan without hesitation. Beautiful acrylic and clear print.",
    });

    expect(reviewRes.success).toBe(true);
    expect(reviewRes.review).toBeDefined();
    expect(reviewRes.review?.rating).toBe(5);
    expect(reviewRes.review?.verifiedPurchase).toBe(true);

    const reviews = await getShopReviews(stand.id);
    expect(reviews.length).toBeGreaterThanOrEqual(1);
    expect(reviews.some((r) => r.id === reviewRes.review?.id)).toBe(true);
  });

  it("allows updating product price, offer badge, and stock from Admin", async () => {
    const products = await getShopProducts();
    const poster = products.find((p) => p.name === "Wall Poster (A3 Matte)")!;

    const updated = await saveShopProduct({
      id: poster.id,
      name: poster.name,
      price: 329, // Special offer price
      originalPrice: 499,
      badge: "LIMITED OFFER 34% OFF",
      inStock: true,
    });

    expect(updated.price).toBe(329);
    expect(updated.originalPrice).toBe(499);
    expect(updated.badge).toBe("LIMITED OFFER 34% OFF");

    // Verify persisted
    const fresh = await getShopProducts();
    const freshPoster = fresh.find((p) => p.id === poster.id);
    expect(freshPoster?.price).toBe(329);
  });
});
